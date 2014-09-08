---
title: "Metalsmith Part 3: Refining Our Tools"
date: 2014-04-29
template: single.hbt
---
[Last time](http://www.robinthrift.com/posts/metalsmith-part-2-shaping-the-metal/) we took a dive into collections and Metalsmiths internals. This time we are going to refine our script and even develop our own little plugin.

Without wasting any time, let's get started!

###Writing Plugins
I am going to start this tutorial off with a little plugin, that will save us a time, and automate our build process further. In order to render our posts correctly, we have to set every posts template individually. As most posts will likely have the same template, this is a little unnecessary, and error prone. So let's change that.

Firstly a little reminder, how Metalsmith represents files internally:
```js
{
    'title': 'FROM_THE_TITLE_KEY',
    'template': 'TEMPLATE_NAME',
    'contents': <Buffer()>,
    'mode': 'HEX_FILE_PERM_CODE'
}
```

And Metalsmith passes an object with all the files to every function that is passed to `.use()`. But that's not all, Metalsmith also passes you the current Metalsmith instance and a function to call, when you're done, so a full plugin would look like this:
```js
var plugin = function(files, metalsmith, done) {
    console.log(files);
    done();
};

Metalsmith(__dirname)
    //...
    .use(plugin)
    //...
```
<div class="note--small">The object keys represent the file path.</div>

As you can probably guess, this will simply log all the files to the console. Go ahead and try it, it will give you a feel about how Metalsmith works.  

Before we go on, we should modify out plugin to return a function. This allows us to pass the plugin a configuration object (and use it multiple times with different configs):

```js
var findTemplate = function(config) {
    return function(files, metalsmith, done) {
        //...
        done();
    };
};
```
We want our plugin to add a template key to our posts (if there is none), so we'll need to filter out our posts first. We will do so, by looping over the files list and use a regular expression to check if the file is a post:

```js
var findTemplate = function(config) {
    var pattern = new RegExp(config.pattern);

    return function(files, metalsmith, done) {
        for (var file in files) {
            if (pattern.test(file)) {
                var _f = files[file];
                if (!_f.template) {
                    _f.template = config.templateName;
                }
            }
        }
        done();
    };
};
```
We can now use the plugin as follows:

```js
Metalsmith(__dirname)
    //...
    .use(findTemplate({
        pattern: 'posts',
        templateName: 'post.hbt'
    }))
    //...
```
<div class="note--small">Don't forget to remove the template key from your posts!</div>

####metalsmith.metadata()
As you can see by the example above, each plugin is also passed the current metalsmith instance. This allows you to pass around, or set, global metadata. This includes things like the collections we created in the last tutorial, but also configuration. There's a plugin called [metalsmith-metadata](https://github.com/segmentio/metalsmith-metadata) that loads extra config data from a file. You could use this to set things like the base URL, similar to Jekyll's `_config.yml`.


####A Note Error Handling
Metalsmith uses [ware](https://github.com/segmentio/ware) to allow for the nice chaining syntax, however, this also means we need to adapt our error handling. Firstly, if an error occurs, we shouldn't just throw it, we should pass it to the `done()` function as the first parameter. Like so:

```js
//...
done(new Error('Oh noes!'));
//...
```

We can then catch the error in the `build()` method. To do so, we pass it a callback, which first parameter will be the error, if any (the second parameter is a list of all the files):

```js
//...
    .build(function(err) {
        if (err) { throw err; }
    });
```

Now that we've got that out of the way, let us continue improving our script!

###Statics
Most websites (even simple ones) will need some kind of static assets, like styles, scripts or fonts. We will get to preprocessing styles and scripts in a bit, but for now, we'll assume that we are using good ol' CSS and plain, old, simple, non-fancy, unsexy, no-frills-no-spills, boring, not-named-after-a-beverage JavaScript.

To copy over these *exciting* files we will just add them to our `src/` directory. 
```
.
|– src/
    |– content/
    |– images/
    |– styles/
    |   |_ main.css
    |_ scripts/
        |_ main.js
|– templates/
|   |_ partials/
|– config.json
|– index.js
|_ package.json
```

That's it. Metalsmith will copy the files over, including the file structure. Done. `next()`!

###Preprocessing
Now using plain CSS and JS is boring, SCSS and CoffeeScript are way more fun! At least, we'll pretend for now, because that's what we are going to set up now.
Firstly we will need to install the CS ([metalsmith-coffee](https://github.com/joaoafrmartins/metalsmith-coffee)) and SCSS ([metalsmith-sass](https://github.com/stevenschobert/metalsmith-sass)) plugins via npm:

```
$ npm install --save-dev metalsmith-coffee metalsmith-sass
```

Then require them in your build script and add them to your chain (they will filter the files themselves):

```js
//...
    .use(sass({
        outputStyle: 'compressed'
    }))
    .use(coffee())
//...
```

Both plugins accept all the options their respective underlying plugins do. Check the docs, if in doubt.


###Were to go from here
This time, we learnt, how to write out own little plugin and set up the rest of the "basic" plugins. I didn't include any styles here, as that would be beyond the scope of this tutorial, and with the static assets in place now, you can simply add them yourself.

From here, you can go anywhere with a little JavaScript, so next time I will show an example, of a more complex plugin and hopefully you will fully understand the Metalsmith ecosystem.

The full source code for this part of the tutorial can be found [here](https://github.com/RobinThrift/metalsmith-tutorial/tree/END-OF-PART-3)
