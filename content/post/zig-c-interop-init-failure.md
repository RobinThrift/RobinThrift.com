+++
title = "Zig C Interop Adventures"
date = 2020-06-07T00:00:00+01:00
tags = [ "zig", "opcua", "c", "open62541" ]
+++

So this post initially started out as a sort of experience report on how I got Zig working with a C library ([open62541](https://github.com/open62541/open62541)) I am quite familiar with, especially in terms of C interop, as I was using it with CGo. However, this little experiment did not go quite as planned...

### Quick Background and Motivation

[OPC Unified Architecture (UA)](https://opcfoundation.org/about/opc-technologies/opc-ua/) is an industry standard for the communication between devices, primarily designed for manufacturing/factory floor settings. I know, great explanation, but this article is not about OPC UA.
I could write dozens and dozens of pages about my thoughts on OPC UA.
For now, just know that it's used in factory settings like IIoT (Industrial Internet of Things), meaning it might run on smaller hardware, sometimes even in an embedded environment.

For this reason using a fast and efficient language would be a good idea. Most of our services are generally written in Go which is good enough, but Go interop with C is sometimes very annoying and not really an ideal situation (plus it comes with some overhead).

While CGo has its fair share of problems[^cgoprobs], overall I am quite impressed with how easy it was to get working. Converting from Go world to C world and vice versa is very annoying though, and I am 100% sure that there are plenty of memory leaks or null pointer access hidden in there somewhere.

[^cgoprobs]: Just to name a few which are most important for me: speed and cross compiling

So when I cam across Zig and its promise of super easy C interop, I was intrigued. It looked very interesting and certain aspects seemed almost "inspired" by Go[^zigcimportconv].

[^zigcimportconv]: It seems to be a convention in Zig to import all C imports as `c` in Zig and then accessing it as `c.UA_DataType` which looks just the same as Go's access to C exports.


## Zig C Interop Basics

Importing C types, variables, functions, etc. in Zig is very straightforward:

```zig
const c = @cImport({
    @cInclude("open62541/types.h");
    @cInclude("open62541/server.h");
});
```

Then the `build.zig` needs a few tweaks to point it to the correct paths and tell it to link to the correct library:

```zig
const open62541 = b.addStaticLibrary("libopen62541", "open62541/build/bin/libopen62541.a");
// ...
exe.addIncludeDir("open62541/include");
exe.addIncludeDir("open62541/build/src_generated");
```

Zig is still very new and the docs, especially when it comes to the build system are not great yet. Which is a shame because the build system seems really cool, but I am sure they will be working on that in due time.

That was all that was necessary to get a very basic OPC UA server working. The code you can see here:

```zig
pub fn main() !void {
    var server = c.UA_Server_new() orelse return error.UnkownStatusCode;
    defer c.UA_Server_delete(server);
    var config = @ptrCast(*c.UA_ServerConfig, c.UA_Server_getConfig(server));
    try ua_error(c.UA_ServerConfig_setDefault(config));

    try ua_error(c.UA_Server_run_startup(server));

    const waitInternal = false;

    while (true) {
        const timeout = c.UA_Server_run_iterate(server, waitInternal);
        std.time.sleep(timeout * 1000);
    }

    try ua_error(c.UA_Server_shutdown(server));
}
```

All looked well, I was optimistic!


## Zig being Zig

The next step was to interact with the server instance a bit, add some variables, etc.
The first hurdle was, as it always seems, strings. Converting from Go strings to C strings requires the use of `C.CString` and will force reallocation of the string on the C heap, which means it also needs to be manually freed. There's no way to pass a stack allocated Go string to a C function without the use of a bunch of `unsafe` trickery and a bit of luck.

Zig has no built-in notion of strings, instead treating them simply as `[:0]const u8`, zero-terminated arrays of unsigned 8-bit integers. This maps quite closely to C's idea of strings `char*` or `char[]`. While passing a string from Zig to C at least doesn't require a reallocation it still requires a cast using `@ptrCast([*c]const u8, &stringVar)`.
However, all (stack allocated) strings in Zig are marked as `const`, meaning if a C function takes a `char*` parameter, as opposed to a `const char*`, Zig throws up its arms and gives up.
I think this the correct behaviour and most C compilers rightfully warn users when a cast discards a `const` modifier.
Unfortunately though, in my case, the `UA_LOCALIZEDTEXT` function takes two `char*` instead of `const char*` arguments, so if Zig marks the string as `const`, it's `const` and to change that the string would have to be reallocated.
This is hardly better than Go. While local variables can be marked as `var`, function parameters in Zig are always immutable, so no luck there.

I didn't go much further from here. Maybe there is a way of coercing the `const` away somehow. Maybe it's a "bug" in the C lib that should be fixed.
I guess I could write a C function which takes a `const` pointer and dangerously cast it away, returning the same pointer as non-`const`.
Maybe a catch all `type_erasure` function which just returns `(void*)input` could be used as a catch all escape hatch, but that really just feels wrong.
If I hadn't run into the next problem, I might have actually tried it.


## C being C

I don't dislike C, in fact I quite like C in a certain way. Sometimes just writing to memory willy-nilly can be fun. Sometimes I want to rip my hair out over the same kind of "whatever could this memory be, nobody knows"-situations.
C has many features that directly relate to it's memory-ness, one of them being *bitfield*s.
I don't want to get into what bitfields are here, there are probably far better resources out there if you're interested.
Zig's C interop works in a way that it parses the C header file as C and then transforms the C AST, *Abstract Syntax Tree*, to a Zig AST and then continues the compile step as normal.
At least that's what I read somewhere in some GitHub issue which I can't seem to find now.
In theory this is cool and even allows fairly easy translation from C code to Zig code (potentially converting an entire project from C to Zig, similar to something like [corrode](https://github.com/jameysharp/corrode) for C to Rust).
In practice this means that Zig must support all C features you want to use.
While Zig supports most features, it currently doesn't support bitfields properly, instead rendering those structs simply as `@OpaqueType()`.
When just *using* that type, passing it from C function to C function that wouldn't be the end of the world.
However, because an `OpaqueType` doesn't have a known size in Zig, creating arrays of such types is not allowed, causing the following error message in my case:

```
error: array of type '.cimport:1:11.struct_UA_DataType' not allowed
pub extern const UA_TYPES: [197]UA_DataType;
```

Here's the shortened definition of `UA_DataType` at the time of writing, for those that are interested:

```c
struct UA_DataType {
    const char *typeName;
    UA_NodeId typeId;
    UA_UInt16 memSize;
    UA_UInt16 typeIndex;
    UA_UInt32 typeKind         : 6;
    UA_UInt32 pointerFree      : 1;
    UA_UInt32 overlayable      : 1;
    UA_UInt32 membersSize      : 8;
    UA_UInt32 binaryEncodingId;
    UA_DataTypeMember *members;
};
```

Those pesky colons followed by a number are the problem, those are the *bitfields* that Zig doesn't like.
And as `UA_DataType` is more than just *essential*, my journey, trying to get open62541 to work with Zig, ended.


## Conclusion

**I like Zig**. While experimenting I was writing a different article in which I was documenting my journey and my thoughts.
I am not holding this against Zig in any way and I hope they can fix this at some point. I will certainly be revisiting Zig soon, when I find a project which doesn't use those pesky bitfields.
Zig has many interesting features and I really, really enjoyed the short time I had with it.
The build system seems cool, the way Zig deals with errors is a great hybrid of other modern approaches that doesn't seem to get in the way.
Even the C interop overall is easy and intuitive. This problem is a very specific problem in a very specific usecase for a very specific reason.
Again, I don't hold this against Zig.

You should definitely try Zig!


### Addendum

At the time of writing [chroma](https://github.com/alecthomas/chroma) did not have support for Zig highlighting and, because this blog is built in [Hugo](https://gohugo.io/) which uses chroma, neither does this article. I sent a [PR](https://github.com/alecthomas/chroma/pull/364) to the chroma team which was merged within 5 minutes of me opening it. So huge props to [Alec Thomas](https://github.com/alecthomas). Now I will be eagerly awaiting a new chroma and subsequent Hugo release!
