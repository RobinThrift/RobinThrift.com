+++
title = "Error Handling in Swift?"
date = 2017-07-03T00:00:00+01:00
tags = [ "swift" ]
+++

I've been writing a lot of Swift recently, both for iOS and macOS (maybe some server side Linux stuff in future too). Whenever you learn a new language you initially take some idioms from other languages with you. I am primarily a JavaScript developer, where, due to the nature of things, most operations are asynchronous, so they are wrapped in promises. Error handling in this case is mostly handled in anonymous functions where the first parameter is the error object:

```javascript
fs.readFile('some/file.ext')
    .then((content) => {
        // do something with the content...
    })
    .catch((error) => {
        console.error(error)
    })
```

Recently though this has changed through the use of `async/await`. Instead of using the `catch` callback on a promise we are back to `try/catch`:

```javascript
try {
    let content = fs.readFile('some/file.ext')
    // do something with the content...
} catch (error) {
    console.error(error)
}
```

While `asnyc/await` is amazingly useful, we've come full circle, back to exceptions like in Java, C# or C++ where I've seen a lot of code like the following.

```java
try {
    String contents = new File("some/file.ext").readAll()
} catch (IOException e) {}

```

Or worse, just letting the method throw, bubbling up the call chain. 

Having worked with Go and Rust this felt a little backwards. Go especially used to advertise with the premise that they didn't have any exceptions (there are [panics](https://github.com/golang/go/wiki/PanicAndRecover) however). Both Go and Rust make error handling a core part of programming, not an "exception".
I don't want to go into too much detail about Rust or Go, but here's a very quick recap of how they handle errors.

**Rust:**  
```rust
// opened `file` above (error also dealt with using `match`)
let mut s = String::new();
match file.read_to_string(&mut s) {
    Err(why) => panic!("couldn't read file: {}", why.description()),
    Ok(_) => print!("contents:\n{}", s),
}
```

Rust uses the [`Result<T, E>`](https://doc.rust-lang.org/std/result/)-type; an enum that covers the two possible cases of an operation:

```rust
enum Result<T, E> {
   Ok(T),
   Err(E),
}
```

**Go:**  
```go
dat, err := ioutil.ReadFile("/some/file.ext")
if err != nil {
	//...
}
```

Go uses multiple return parameters to inform the user that a function could return an error. While it may be a little less elegant than Rust's `Result`-type the error handling is very expressive.


### Errors in Swift?

So finally after we've set the playing field we get to Swift. Reading about Swift and how much it seemingly took out of the functional (and in turn Rust's) playbook I was excited to see what the Swift team had come up with. Queue my disappointment when I saw the examples and they defaulted to "old school" `try/catch`. Seems a bit a waste of the type system. So when writing Swift code, especially asynchronous code, I needed a way other than just throwing an error out there, hoping someone would catch it. Maybe it's due to my inexperience with Swift that I did not like the uncertainty of `throw`ing.

Initially I tried Go-style tuples and destructuring as a kind of "fake" multiple return parameters. So a function that could fail looked this:

```swift
func readFile(path: String) -> (String?, Error?) {
    do {
        let content = try String(contentsOf: path, encoding: String.Encoding.utf8) 
        return (content, nil)
    } catch (let e) {
        return (nil, e)
    }
}
```

This worked, and solved my problem, but it meant that everything had to be declared as optional. So instead of using the type system to my advantage, encoding logic in types, I threw away some type safety and convenience. So after a while I decided to switch to Rust-style `Result`s:

I created my own `Result`-enum:

```swift
enum Result<T> {
    case Value(T)
    case Error(Error)
}
```

```swift
func readFile(path: String) -> Result<String> {
    do {
        let content = try String(contentsOf: path, encoding: String.Encoding.utf8) 
        return .Value(content)
    } catch (let e) {
        return .Error(e)
    }
}
```

Now I could use `switch` statements to handle my errors:

```swift
switch readFile("some/file.ext") {
case .Value(let content):
    print(content)
case .Error(let error):
    print(error)
}
```

In future I could even extend the `Result` enum using functions like `map` or `flatten` to make handling errors even easier. I can pass the result around, confident that the type system will make sure I don't do anything stupid (spoiler alert: I will find a way regardless).

I'm not sure if this is the most idiomatic way to handle errors in Swift, but it certainly beats `try/catch` for me.
