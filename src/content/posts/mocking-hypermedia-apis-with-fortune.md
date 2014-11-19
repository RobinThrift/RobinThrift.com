---
title: "Mocking Hypermedia APIs with Fortune.js"
date: 2014-11-20
template: single.hbt
---

Now we all know what a RESTful API is, right? Well almost. What most people mean by a "REST API" is usually
what RoR gives you, when you use the built in generators and models. You know, the `/users` and `/users/1`. While
this is not fundamentally wrong, the RoR-Style REST APIs are missing a few bits here and there. I won't go into 
detail here, but feel free to read the [original dissertation](http://www.ics.uci.edu/~fielding/pubs/dissertation/top.htm) by
Roy Thomas Fielding if you're interested.

As the term "REST" had now been coined a couple of smart people came up with a new name for "real" REST APIs: "Hypermedia API". One
of the implementations, and the one we'll be covering here will be the [JSON API](http://jsonapi.org/) specification.

If you google "mock json api" you'll find a Stackoverflow question, [Mocky.io](http://www.mocky.io/) and a GitHub project called
[JSON Server](https://github.com/typicode/json-server). Sounds promising, but while it's a cool little project, it does in fact just
serve JSON "REST-Style" and does not implement the [JSON API](http://jsonapi.org/) specification.

So no luck googling... But I recently stumbled over a little project called [Fortune.js](http://fortunejs.com/), which says it implements the
[JSON API](http://jsonapi.org/) specification. It also includes an API that let's you easily create models and relationships between them as well
as source your data from a number of databases (MySQL, NeDB, Postgres, and  SQLite at the time of writing). We'll be mainly using 
[NeDB](https://github.com/louischatriot/nedb) as it's the easiest to work with.

<div class="side-note">
NeDB is an "embedded persistent database for Node.js, written in Javascript".
</div>

### Most Basic Example:
First we need to install `fortune.js`:

```none
$ npm install fortune
```

Then we can use it like this:

```js
var fortune = require('fortune'),
    server  = fortune();

server.listen(1337);
```

This will start an [express.js](http://expressjs.com) server on port `1337`. Not very exciting and 
actually pretty useless. So let's add a model:


```js
var fortune = require('fortune'),
    server  = fortune();

server.resource('user', {
    username: String,
    email: String,
    age: Number
});

server.listen(1337);
```

This will automagically create a bunch of routes for us:

- GET `/users`: Lists all users
- GET `/users/:id`: Retrieves a single user by id
- Plus a bunch of creation and update routes

<div class="side-note">Check the [fortune.js docs](https://github.com/daliwali/fortune#basic-usage) for a full list of routes.</div>

We'll test this by `POST`ing so data to it (using a tool like [Postman](https://chrome.google.com/webstore/detail/postman-rest-client/fdmmgilgnpjigdojojpjoooidkmcomcm?hl=en) or [Hurl.it](https://www.hurl.it/)):

```json
{
    "users": [
        {
            "username": "Rob",
            "email": "someone@example.com",
            "age": 25
        }
    ]
}
```

If everything goes as intendet we'll get the exact same data back. And by simply `GET`ing `/users` we can confirm, that we
created a new user (which is persistent).


### Relationships

Let's add another resource and connect the two (note, that fortune pluralizes our strings automatically):

```js
server.resource('user', {
    username: String,
    email: String,
    age: Number,
    posts: [{ref: 'post', inverse: 'author'}]
});

server.resource('post', {
    content: String,
    title: String,
    date: Date,
    author: 'user'
});
```
Each user is asigned a collection of posts (one-to-many), an each post has exactly one author, which we will map to 
the `author` key. If we request `/users` now, we should ge something like:

```json
{
    "users": [
        {
            "id": "4RvBm0Z1izH0q6bS",
            "username": "Rob",
            "email": "someone@example.com",
            "age": 25
        }
    ],
    "links": {
        "users.posts": {
            "href": "/posts/{users.posts}",
            "type": "posts"
        }
    }
}
```

This might be a little unfamiliar if you're not used to Hypermedia APIs, but it's a very
flexible representation of your data.

Now let's add a post:

```json
{
    "posts": [ 
        {
            "title": "Lorem Ipsum",
            "content": "Nothing to see here",
            "date": "2014-11-28",
            "links": {
                "author": "4RvBm0Z1izH0q6bS"
            }
        }
    ]
}
```

By posting this to `/posts` we'll add a new post and connect it to the user with the id "4RvBm0Z1izH0q6bS". As you can see,
our `author` to `user` mapping still holds and makes for a very nice data structure.
