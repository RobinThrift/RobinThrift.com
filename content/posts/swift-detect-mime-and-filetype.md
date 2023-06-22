+++
title = "Detecting MIME type and file extension in Swift (using Uniform Type Identifiers)"
date = 2018-10-07T00:00:00+01:00
tags = [ "swift", "ios", "macos", "matrix", "entropy" ]
+++

## Why do we want to detect the MIME type or file extension?

The [Matrix spec](https://matrix.org/docs/spec/) defines several messaging types for attachments (essentially binary blobs). The generic `m.file` can be used to send any type of file as an attachment. Common file types like audio, video, and especially images however have their own message type (`m.audio`, `m.video` and `m.image` respectively). So when sending images (or video, or audio) we want to send it using the appropriate message type.

One way of trying to determine, what kind of attachment we are sending is the extension. While this is not 100% accurate, it's a good first guess. However, we will need to maintain some kind of list, mapping extension (or MIME type) to message type. Nobody likes maintaining lists like that as it's easy to forget a type or make mistakes. So I thought there must already be a predefined list
somewhere. Turns out, Apple's OSs do.


## System-Declared Uniform Type Identifiers

Apple has this fund little list of what they call ["System-Declared Uniform Type Identifiers"](https://developer.apple.com/library/archive/documentation/Miscellaneous/Reference/UTIRef/Articles/System-DeclaredUniformTypeIdentifiers.html) where all the known file types are listed (and their respective constants like `kUTTypePNG`). You can also add your own using the provided APIs (and benefit from any other application adding their definition, I believe).

When trying to look into how to actually use them however, things get a bit iffy. So let's have a look at the API.

Let's try to create a UTI from a file extension in Swift:

> NOTE: In order to use these in iOS you'll need to import `MobileCoreServices`

```swift
let fileExtension: CFString = "png"
let extUTI = UTTypeCreatePreferredIdentifierForTag(
    kUTTagClassFilenameExtension,
    fileExtension,
    nil
)?.takeUnretainedValue()
```


[`UTTypeCreatePreferredIdentifierForTag`](https://developer.apple.com/documentation/coreservices/1448939-uttypecreatepreferredidentifierf) returns an `Unmanaged<CFString>?`. If you don't know what `Unmanaged` is, I recommend reading the [NSHipster Guide on Unmanaged](https://nshipster.com/unmanaged/).

This will essentially return `nil`, if the extensions was not recognized, or a new `CFString` (of which we'll want to take an unretained value in most cases).

Now that we have a UTI for this file extension we can use it to check conformity to a type class or get its associated MIME type.


```swift
let fileExtension: CFString = "png"
guard
    let extUTI = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, fileExtension, nil)?.takeUnretainedValue()
else { return }

guard
    let mimeUTI = UTTypeCopyPreferredTagWithClass(extUTI, kUTTagClassMIMEType)
else { return }

print(mimeUTI) // will print 'image/png'

```

[`UTTypeCopyPreferredTagWithClass`](https://developer.apple.com/documentation/coreservices/1442744-uttypecopypreferredtagwithclass) can be used to transfrom one UTI to another tag class, which we are doing here.

We can try to get an appropriate file extension for a given mime type too:


```swift
let mimeType: CFString = "image/png"
guard
    let mimeUTI = UTTypeCreatePreferredIdentifierForTag(kUTTagClassMIMEType, mimeType, nil)?.takeUnretainedValue()
else { return }

guard
    let extUTI = UTTypeCopyPreferredTagWithClass(mimeUTI, kUTTagClassFilenameExtension)
else { return }

print(extUTI) // will print 'png'

```

Lastly let's use [`UTTypeConformsTo`](https://developer.apple.com/documentation/coreservices/1444079-uttypeconformsto) to check if our extension is an image:


```swift
let mimeType: CFString = "image/png"
guard
    let mimeUTI = UTTypeCreatePreferredIdentifierForTag(kUTTagClassMIMEType, mimeType, nil)?.takeUnretainedValue()
else { return }

print(UTTypeConformsTo(mimeUTI, kUTTypeImage)) // will print `true`
```

So this is how you can use Apple's "System-Declared Uniform Type Identifiers" to detect the extension, MIME type and conformity of files in Swift.
If you're interested in the full code and tests, check out the [repo](https://github.com/Kodeshack/EntropyKit)

> Direct link to the file at the time of writing: [here](https://github.com/Kodeshack/EntropyKit/blob/7126b7079eeb1e3e3b6e5faec802dcfa2468d527/Sources/Utilities/MIMEType.swift)
> And the tests: [here](https://github.com/Kodeshack/EntropyKit/blob/7126b7079eeb1e3e3b6e5faec802dcfa2468d527/Tests/Utilities/MIMETypeTests.swift)
