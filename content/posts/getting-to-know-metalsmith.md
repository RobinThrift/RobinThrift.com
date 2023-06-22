+++
title = "Getting To Know Metalsmith"
date = 2014-04-13T00:00:00+01:00
+++

There are dozens of static site generators out there. The most popular is probably [Jekyll](http://jekyllrb.com/), and for good reasons! It's super easy to set up, has a lot of great features built in and there are a loads of plugins floating around. It's also the engine powering [GitHub Pages](https://pages.github.com/), GitHub's static site hosting for projects and users (this site too, is hosted on GH-Pages, you can find the source code [here](https://github.com/RobinThrift/RobinThrift.com)). Static sites make it super easy to version control your site and also let others contribute to your site (fork it and fix my typos ;) ), as well as learn from it.

I built a few websites using Jekyll, but as my ruby-fu&trade; is quite limited I had a few problems when it came to plugins, especially developing my own, also I didn't like to depend on ruby, but I guess that's just me being the JS guy I am. Although I plan on learning ruby in-depth at some stage, I'm not there yet. Also I simply wanted to try something new, preferably JavaScript based.

Recently I've been using [Gulp.js](http://gulpjs.com/) for all of my build scripts and I thought about using that. While I certainly could have done so, I don't think it would have been very elegant. I like the way Gulp works, for projects like web apps, as it's very flexible. For static sites/blogs however, it didn't feel quite right. Of course there are tons of JS-based static site generators out there, but most weren't quite what I was looking for. [Assemble.io](http://assemble.io/) seems quite powerful but I couldn't quite get myself to like it. I don't think the structure of the website/docs are very good for beginners.

This is were Metalsmith comes in.


### Forging with JavaScript

[Metalsmith](http://www.metalsmith.io/) by the guys over at [Segment.io](https://segment.io/) is "an extremely simple, pluggable static site generator". What that means is, is that everything is a plugin. There's a very small core which creates a list of files for your plugins to work with (similar to Gulp). You give it a source directory and then tell it which plugins to use; if you know [express.js](http://expressjs.com/) or have used Gulp before, this will look very familiar:

```js
Metalsmith(__dirname)
    .use(markdown())
    .use(templates('handlebars'))
    .build();
```

The first line simply creates a new instance of the Metalsmith object which looks for a folder named `src` in the given directory, `__dirname/src` in this case. We then specify two plugins that will process the input files found in the source directory. The fist one is `markdown()`, which processes markdown files (eg *.md) and converts them into .html files. 

Metalsmith will also parse any YAML front-matter at the top of every file, which acts as metadata, e. g. title, date and template.

The second plugin is `templates()`, a thin wrapper on top of [consolidate.js](https://github.com/visionmedia/consolidate.js) used to render the templates specified in the YAML front-matter. The argument you pass in is the engine that consolidate.js will use, so you can use any templating engine you like, i. e. Jade, Handlebars, Swig, etc.

Immediately you can see how flexible and modular Metalsmith is, while at the same time being elegant and very, very easy to develop for and work with.

In this series I will go over my experiences with Metalsmith and how I built this website. I want to cover everything from simple beginner topics like file structure to more advanced usage and plugin development, like my [pagination plugin](https://github.com/RobinThrift/metalsmith-paginate).

Join me next time when I will go over the file structure and basic setup.

#### Update: Tutorials Posted

I have started writing the tutorials:

- [Metalsmith Part 1: Setting Up the Forge]({{< ref "metalsmith-part-1-setting-up-the-forge.md" >}})
- [Metalsmith Part 2 : Shaping The Metal]({{< ref "metalsmith-part-2-shaping-the-metal.md" >}})
- [Metalsmith Part 3: Refining Our Tools]({{< ref "metalsmith-part-3-refining-our-tools.md" >}})

