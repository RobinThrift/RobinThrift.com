---
title: "Metalsmith Part 1: Setting Up the Forge"
date: 2014-04-14
template: single.hbt
draft: false
---
In my [last article](http://www.robinthrift.com/posts/getting-to-know-metalsmith/) I gave a brief introduction to [Metalsmith](http://www.metalsmith.io/), a simple, pluggable static site generator written in JavaScript. In this tutorial I want to show, what a basic folder structure for Metalsmith could look like and we will also set up the basic build script.

The source code for this tutorial can be found [here](https://github.com/RobinThrift/metalsmith-tutorial/tree/END-OF-PART-1).

<span class="side_note">You will need Node.js and NPM. To find out, how to install them check the [official documentation](http://nodejs.org/).</span>

###Collecting the Materials

I usually start every project by thinking about the basic folder structure. A good folder setup is key to keep your files organised and maintainable. For our purposes I think the following structure will do the job:

```
.
|– src/
    |– content/
    |– images/
    |– styles/
    |_ scripts/
|– templates/
|   |_ partials/
|– config.json
|– index.js
|_ package.json
```

Let's start at the bottom: The `package.json` will hold our dependencies which we'll be setting up now. For this simple example we will only need a few packages, namely Metalsmith. You can either add it to your `package.json` under the `dependencies` or `devDependencies` key, but I usually just use the command line to install the package and save it as a dependency at the same time. If you choose to add them manually to the `package.json` don't forget to run `npm install` to install all your dependencies once you've declared them.

So let us go ahead and install Metalsmith. Using the command line execute the following:
```
$ npm install --save-dev metalsmith
```

Now let's create the actual build file which will contain the instructions on how to generate our site. I will call this `index.js` but you could also call it `build.js` or something along those lines (index.js is often the "default" for node projects). We'll start with some boilerplate code:

```js
var Metalsmith = require('metalsmith');


Metalsmith(__dirname)
    .destination('./build')
    .build()
```

While this code doesn't do anything except copy the files from `src/` to `build/` it does give us a good starting point at least. Metalsmith will look for a folder named `src` in the given directory. You could change the source folder by calling the `source()` method and passing it a directory name. Here we are using a variable set by node that will point to the directory our build file is in. Then we set the destination folder using the `destination()` method, and then tell Metalsmith to run by calling `build()`.


###Adding some Content

As I said before, our script is pretty much useless right now, so let's add some content. Create a file name `index.md` in the `src/` directory and fill it with the following content:

```markdown
---
title: Home
---
Hi, this is my start page; neat ain't it? ;)

###Some info!
```

The first block enclosed by the `---` is YAML front-matter, a simple format used to associate metadata with the file that Metalsmith parses and can then be used by plugins. In this example we are telling Metalsmith that the title of the page is "Home", nothing too useful yet. What follows after the front-matter is markdown which we'll be easily able to convert to HTML.

<div class="side_note">If you are not familiar with markdown check out [this](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet) guide.</div>

To do so we will first need to install the markdown plugin for metalsmith, conveniently named `metalsmith-markdown`. So go ahead and add it to your `package.json` or install it via the command line:

```
$ npm install --save-dev metalsmith-markdown
```

Then we simply need to require it and call it in our build file:

```js
var Metalsmith = require('metalsmith'),
    markdown   = require('metalsmith-markdown');


Metalsmith(__dirname)
    .use(markdown())
    .destination('./build')
    .build() 
```

If you run the build script now (`node index`) you will find a file named `index.html` in the `build` directory. As you can see it's super easy to add plugins to Metalsmith and customise the way your files are processed. If you have ever worked with [Gulp](http://gulpjs.com/) or [express.js](http://expressjs.com/) this will look very familiar.


###Shaping Your Content

Of course rendered markdown is not enough to make a full website. In this next step we will add some templates to wrap our content. For this we will use another Metalsmith plugin cleverly called `metalsmith-templates`. As before go ahead and install it and add it to your build script:

```
$ npm install --save-dev metalsmith-templates
```

```js
var Metalsmith = require('metalsmith'),
    markdown   = require('metalsmith-markdown'),
    templates  = require('metalsmith-templates');


Metalsmith(__dirname)
    .use(markdown())
    .use(templates())
    .destination('./build')
    .build()
```

As with the markdown plugin we simply pass the `templates()` function to the `use()` method to tell Metalsmith to use this plugin. However we are still missing some key parts for this to work, firstly some templates and a templating engine. `metalsmith-templates` is build on top of [consolidate.js](https://github.com/visionmedia/consolidate.js), which gives us tons of engines to choose from. I will go with [Handlebars](http://handlebarsjs.com/) but you could also choose [Jade](http://jade-lang.com/) or [Swig](http://paularmstrong.github.io/swig/). 

We need to install our engine and tell `metalsmith-templates` which engine to use:

```
$ npm install --save-dev handlebars
```

```js
// ...
.use(templates('handlebars'))
// ...
```

Next we need to create a simple template in the `templates/` folder, so create a file called `home.hbt` (or whatever extension your engine uses) and fill it with some templating goodness:

```handlebars
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>{{ title }} | Metalsmith Page</title>
</head>
<body>
    <div class="main-wrapper">
        {{{ contents }}}
    </div>
    
</body>
</html>
```

Now we have to tell Metalsmith which template we want to use wrap the index.md, so we add a "template" key to the YAML front-matter:

```
---
title: Home
template: home.hbt
---
```

Now run you build script et voilà, a wrapped index.html in our `build/` directory. 


####Turn the heat up
Next time I will dive more into the inner workings of Metalsmith and I will show you how to work with collections, multiple types of content and how to further structure your project.

Take some time and experiment with Metalsmith and read the docs over at [Metalsmith.io](http://www.metalsmith.io/).

The source code for this tutorial can be found [here](https://github.com/RobinThrift/metalsmith-tutorial/tree/END-OF-PART-1)

#####Update:
You can find the next post in this series here: [Metalsmith Part 2 : Shaping The Metal](http://www.robinthrift.com/posts/metalsmith-part-2-shaping-the-metal)

