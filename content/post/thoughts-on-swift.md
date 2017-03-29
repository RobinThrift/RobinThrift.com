+++
title = "Thoughts on Swift"
date = 2017-03-29T00:00:00+01:00
tags = [ "swift", "programming-languages", "programming" ]
draft = true
+++

While I work on iOS apps (and Android) at work, our iOS parts are still all written in Objective-C. I'm not actually an iOS developer (I mainly write JavaScript), but have had enough exposure to Objective-C to know that I'm not a fan, to say the least. I fancy myself a bit of a language enthusiast, so looked for an opportunity to learn me some Swift outside of work, maybe even bringing some of that knowledge back and start writing some Swift at work.

But I needed a project. I've recently started using [Matrix](https://matrix.org) as a sort of Slack replacement personally, especially for its end-to-end encryption. However the current desktop app, "[Riot](https://riot.im)", is, like most other chat apps, just a wrapper around the website. While I am a JS Dev (and former Web Dev), I don't really want 1000 instances of Chrome running on my machine at all times. But native desktop development is something that always struck me as "awkward", especially compared to the relative ease with which I could write beautiful UIs on the web. But alas, I'm a Mac user and I needed a project to get to know Swift, so why not learn some AppKit while I'm at it.

So killing two birds with one stone, me and a couple of friends started writing a macOS app in Swift (which will hopefully be open sourced soon™).


## Setup

If you're using a Mac, setting up Swift is stupidly easy. Install Xcode from the Mac AppStore (*shudder*) and you're good to go. On Linux the setup seems marginally more difficult, but I haven't actually tried that yet, so I can't really comment on that. I will be focusing on macOS development anyway, so Xcode will be a common theme.

### Swift and Vim

I'm a Vim user so naturally the first thing I did before even getting started was search for "vim swift" but didn't find too much besides a couple of language definitions and certainly no proper autocomplete (which is incredibly important in Swift as I will go into later).
Since Apple introduced "official plugins" in Xcode 8, old Xcode plugins no longer work (without resigning Xcode, which I don't want to do). I was stuck using stock Xcode with no Vim mode ☹️.

> Over the weeks I have been using Swift however, this has changed. It is now very possible to write Swift with Vim and only use Xcode when really, really necessary. I might write a separate post about that though.


## Getting Started

We were looking to write a macOS app, so we simply went with a Xcode template, that was easy enough. Everything compiled and built, so no issues here. I only really skimmed the ["The Swift Programming Language"](https://developer.apple.com/library/content/documentation/Swift/Conceptual/Swift_Programming_Language/) "book", so I went in without super in-depth knowledge of the language, trying to learn as I go along, asking stupid questions, and getting help from my friends.


## The Swift Programming Language

I'm a fan of functional programming (FP), so when I read that Swift would incorporate aspects of FP (as is the trend at the moment) I was excited. I've written a fair bit of Java and some C#, so I'm not unfamiliar with OOP (Object Oriented Programming), but coming from JavaScript, with it's first class functions, I was never a huge OOP guy. So I went into Swift with a more FP than OOP mind.

Swift's Objective-C object oriented heritage is very noticeable and the lack of a proper module system (or at least namesapces for crying out) makes it a huge pain to encapsulate functionality, so more often than not, one is back to declaring static methods on a class. Not exactly forward thinking.
I even thought about going back to prefixing my functions (like in C, i. e. `rooms_getRooms()`), but that would look horrible when mixed with the came case used throughout the rest of the language, so just crossed my fingers and hoped there wouldn't be any naming conflicts (spoiler: there were).


### Syntax

I'm still very unsure how I feel about Swift's syntax. It strikes me as a weired mish-mash of C, JavaScript and OOP languages like C# or Java. Maybe even a little bit of Scala. While this comes of no surprise, as these were all influences on Swift, unlike other modern languages like Kotlin, Rust and Go (even EcmaScript 6 and 7) it feels like a very strange mix.

Swift doesn't feel as "raw" as Rust or as imperative-C-like as Go, but instead relies on many keywords and syntactic sugar. `guard` is one of the strange keywords in this mix. Computationally it's a kind of `unless`, but semantically it's very clear. I like it a lot, reminds me of Go's error handling `if err != nil`, which is a good thing! But I will go more into error handling later.

So while Swift's syntax is very clean, it still don't find it as easy to read (human parse, if you will) as languages like Go or JavaScript (as ES6, but I might be biased here). Let's look at this piece of code:

```swift
static public func login(username: String, password: String, completionHandler: @escaping (Account?, Error?) -> Void) {
    let parameters = ["type": "m.login.password", "user": username, "password": password]
    Alamofire.request("\(Settings.clientAPI)/login", method: .post, parameters: parameters, encoding: JSONEncoding.default)
        .validate()
        .validate(contentType: ["application/json"])
        .responseJSON { response in
            switch response.result {
            case .success:
                guard let result = response.result.value as? [String: String] else {
                    completionHandler(nil, JSONError.invalidFormat)
                    return
                }
                // ...
            case .failure(let error): completionHandler(nil, error)
            }
        }
    }
```

Maybe this is just terrible Swift code, but I find it difficult to read at a glance. But this is all just a personal preference, so don't let my opinion on Swift's syntax stop you from enjoying it, maybe it will grow on me in future.

## Error Handling

Just a brief not on error handling. I like expressive error handling. I was never a fan of exceptions, wrapping everything that might fail in a `try...catch`, not knowing what can fail, or how. Go's approach is to simply return two (or more) values. The result(s) and a possible error:

```go
func couldFail(a int) (Something, error) {
    //... oh noes
    return nil, someError

    //... yeah
    return something, nil
}
```

Or Rust's `Result` type:

```rust
fn couldFail(a: i64) -> Result<i64, &'static str> {
    //... oh noes
    return Err(someError)

    //... yeah
    return Ok(value)
}
```

Swift seems to want to use exceptions, but using them just doesn't feel right. Swift provides all the required bits to provide nice, expressive error handling. `switch`-statements can match on types with built in destructuring (like Rust's `match`, albeit not as powerful). But there's also a `do..catch` statement and no built in `Result` type. Sure, Swift has optionals, but you can't express ein
"either or" scenario with optionals. At first I copied Go by returning a tuple `(SomeValue?, Error?)` and then destructuring it `let (value, error) = couldFail()` and using a `guard` statement to check the resulting `error != nil`. But this left me with a bunch of optionals, where I didn't need any because if one was `nil` the other had to not be `nil`.
This can easily be expressed in Swift's type system so I wrote a simple yet effective mini `Result` type:

```swift
public enum Result<T> {
    case Error(Error)
    case Value(T)
}
```

This could then easily be used in `switch`es:

```swift
switch result {
case .Error(let error):
    // do something
case .Value(let value):
    // do something
}
```
> I'm really not sure if I like the `case` on the same indentation level as the `switch`…

This felt more natural to me and uses the type system to accurately describe what I was trying to model, but either approach is better than just throwing exceptions in my opinion.


## Semantics

## Optionals (or rather Optional-Like)

Remember when everyone was talking about `null`-pointers? The dreaded `NullPointerException`. While some languages, like Go, opted just kept it and made it an integral part of the language to deal with them, others decided to abandon the `null` or `nil` entirely and wrap everything in optionals, like Rust.
Swift falls somewhere in between. While there are still `nil`-pointers, there's some syntax sugar to unwrap them using `?` (or force unwrap using `!`). This makes for really clean chaining of optionals: `maybe?.field.anotherMaybe?.field = result.value!`. If `maybe` is `nil` the rest of the chain will silently fail without causing an exception, but if `result.value` is nil, it will throw.
In addition, values that could be `nil` need to be marked as such in their type: `String?`. This allows the type system to check at compile time if the consumer of that value needs to check it or not, instead of the "old way" of Java, C# and Objective-C (or even Ruby), where anything could be `null`. So 1+ for the syntax, but the semantics feel a bit in-between.


## Closing Thoughts

Apple is marketing Swift kind of as "the next big programming language to rule them all", being used in both high level app development and low level systems development. While I can see it being useful and liked in the first, I think it's far, far away from the second. I believe Rust is a much stronger contender for this spot in (the hopefully near) future, for reasons I don't want to go into
here. But what I do want to go into here is my experience with Swift over the last couple of weeks.
Obviously I'm no expert in Swift, but I feel I have experienced enough of the language to at least have an informed opinion about it. And this is my opinion.

Let me start off with my initial conclusion: Swift feels immature. Which is fair, it is still a relatively young language, all things considered. But with all the power and resources of Apple and now almost 3 years since its initial interaction to the public I had hoped it would be a little bit more fleshed out. Especially the tooling. While I'm not an IDE person, I can appreciate a good IDE when I see one... Xcode is not a good IDE.
Its Swift tooling is slow, crashes often and is overall more of a pain, than of any real use. And while I understand that Xcode is not officially part of the language, at the moment it is the way most people will be using it and how Apple is selling it. I'm not 100% sure what Xcode is doing in the background, but waiting 10 seconds (or more) for syntax highlighting to catch up, or errors to appear or disappear is not helpful, but rather annoying and down right disruptive.
In Vim I like to run all checks on save, not while I'm typing. While this might be a personal preference, I'm sure no one needs to be told that `le` is not a valid keyword, while trying to type `let foo` and then wait half a century for the editor to catch up, all the while not having autocomplete.
Needless so say, these are complaints with Xcode, not Swift itself, but as as stated above, at the time of writing Xcode is still an integral part of Swift and its design.

Well at least the errors that Xcode does show (once it's caught up) are usually actual errors. If only the error messages were useful. Many of the error messages are almost cryptic, often appearing in places further down than where the actual error occurs.
I know many programming languages have less than ideal error messages, but in the advent of Rust and Elm (and to a lesser extent Go) with not only accurate and useful error messages, but even hints as to how to fix them, this is simply not acceptable for a modern language.

But not all is bad, Xcode (through the Swift compiler I assume/hope) does offer some useful hints from time to time, like using `let` instead of `var` or missing names for parameters and offering to fix these with a click. Also when the autocomplete works, it works well and is responsive and the placeholders Xcode places in the code are great. A few minor issues with the type inference still
occur in the autocomplete, but these are minor and missing types are simply replaced with a `<<error type>>`, so at least it doesn't just crash (at this point a bonus) and it's usually very easy to fill in the blank.
