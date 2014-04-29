---
title: "Metalsmith Part 2 : Shaping The Metal"
date: 2014-04-18
template: single.hbt
---

In my last [post](http://www.robinthrift.com/posts/metalsmith-part-1-setting-up-the-forge/) I talked about the basic structure of a Metalsmith project and showed you the basics, like templating and plugin installation/configuration. This time we are going to delve further into the subject and look at some Metalsmith internals.

<div class="note">The full source code for this part of the tutorial can be found [here](https://github.com/RobinThrift/metalsmith-tutorial/tree/END-OF-PART-2)</div>

###Content Types
Firstly we will need to determine, what kind of content we want to create, or rather, its type. Wordpress by default gives you two options: posts and pages. Posts are blog posts, so articles that are added regularly and pages are content that doesn't change very often, like contact or about pages. This separation is simple enough so we will use it for now, feel free to add any extra types you will need.

Unlike something like [Jekyll](http://jekyllrb.com/) Metalsmith does not have a built in "static" page and "dynamic" post mechanism, all files are treated (and created) equal. This has advantages and disadvantages, but I think it makes Metalsmith very flexible.

Firstly, create a new folder for each content type in the `src/content` folder. Let's start with an example about page:

```markdown
---
title: About
template: page.hbt
---
Tell the world something about yourself here!
```
<div class="note--small">Save this to `src/content/pages/about.md`</div>

####Template Partials
At this stage we should also create partials for the head and foot section of our template, so we don't have to copy and paste it every time and can simply create a menu or logo that will appear on every page. Every templating engine handles partials differently, so I will only quickly go over my Handlebars version here:

I simply added this to my `index.js` and added a [header.hbt](https://github.com/RobinThrift/metalsmith-tutorial/blob/58ba1d06938cc5fae76a070bd09fb03913474673/templates/partials/header.hbt) and [footer.hbt](https://github.com/RobinThrift/metalsmith-tutorial/blob/58ba1d06938cc5fae76a070bd09fb03913474673/templates/partials/footer.hbt):
```js
// ...
Handlebars = require('handlebars'),
fs         = require('fs');

Handlebars.registerPartial('header', fs.readFileSync(__dirname + '/templates/partials/header.hbt').toString());
Handlebars.registerPartial('footer', fs.readFileSync(__dirname + '/templates/partials/footer.hbt').toString());
//...
```
<div class="note--small">Full diff can be found [here](https://github.com/RobinThrift/metalsmith-tutorial/commit/58ba1d06938cc5fae76a070bd09fb03913474673)</div>

As you can see I created a new sub folder in my `templates/` folder named `partials` with the two partial templates containing the wrapping HTML for our content.

###Creating Content Templates
Now that we have set up our partials it's time to add the page template (as required by the "template"-key in `about.md`), so go ahead and create a `page.hbt` in the `templates/` folder. We won't do anything special here, just print the title and content:

```handlebars
{{> header}}
<h2>{{title}}</h2>

<article>
    {{{contents}}}
</article>

{{> footer}}
```
<div class="note--small">The `{{> header}}` and `{{> footer}}` are including the partials we defined in our `index.js`</div>


When you build your project again, you will find an `about.html`-file under `build/content/pages/`, just as expected.

###Files and Paths
As you might have noticed, Metalsmith replicates the input folder structure in our output folder (`build/`). When you run Metalsmith, it looks though your source folder and creates an internal representation for every file, including it's contents and path. It also populates every internal file object with the metadata you pass it in the YAML front-matter. We end up with an object where each key is the file's path and each file object looks something like this:

```js
{
    'title': 'FROM_THE_TITLE_KEY',
    'template': 'TEMPLATE_NAME',
    'contents': <Buffer()>,
    'mode': 'HEX_FILE_PERM_CODE'
}
```
As you can see it's a very simple and intuitive structure that makes it easy to work with the files and write plugins. But you are not limited to modifying only the files themselves, you can also alter the file list, deleting or adding files (including virtual ones).


###Link Structure
If we leave or site like this, we will have links that look like this: "hostname/content/pages/about.html", but wouldn't it be much nicer (and search engine friendlier) to have a link structure like this: "hostname/pages/about"? 

To achieve this we will need two more Metalsmith plugins: [metalsmith-collections](https://github.com/segmentio/metalsmith-collections) and [metalsmith-permalinks](https://github.com/segmentio/metalsmith-permalinks), so install those and save them to your dependencies. Now we will use these two plugins together to achieve our desired result:

Let's modify our `index.js`
```js
//...
    collections = require('metalsmith-collections'),
    permalinks  = require('metalsmith-permalinks'),
//...

Metalsmith(__dirname)
    .use(collections())
    .use(permalinks())
    //...
    .build()

```
<div class="note--small">Full diff can be found [here](https://github.com/RobinThrift/metalsmith-tutorial/commit/d72b5c4fde8956eefdf92f5c0736cb4d8795998c)</div>


The `collections()` function creates a new array for each collection it can find and lists them in the internal metadata (not the file metadata), which then can be accessed in the templates under `collections.COLLECTION_NAME`. There are two ways to create collections:

- add a "collections" key to a files YAML front-matter
- file path pattern matching

The first option is the quickest, but only allows you to add your content to one collection at a time and is easy to forget. The second option is extremely flexible and safer, so we'll be going with that. So let us add some patterns for our content types:

```js
//...
.use(collections({
    pages: {
        pattern: 'content/pages/*.md'
    }
}))
//...
``` 

Metalsmith will now create a collection for our pages. While it may seem silly to create a collection for our pages it will come in useful when we are constructing our permalinks and when you want to construct a sitemap. For now let's continue with our permalinks:

```js
//...
.use(permalinks({
    pattern: ':collection/:title'
}))
//...
```
<div class="note--small">Make sure to call this after the `markdown()` plugin!</div>


If you run your build script now, you won't find an `about.html` but instead a folder named "about" in the `pages/` folder with an `index.html` file. This will result in a link that looks like this: "hostname/pages/about", just like we wanted.


We can do the same for our posts. So let's create a simple posts called "First Post" in `src/content/posts/first-post.md`:

```markdown
---
title: "First Post"
date: 2014-04-18
template: post.hbt
---
This is an amazing blogpost!
```
<div class="note--small">You will need to also create a post template (you can use the same as for the page for now)</div>

Now we just need to extend the options object for the collections function:

```js
//...
.use(collections({
    pages: {
        pattern: 'content/pages/*.md'
    },
    posts: {
        pattern: 'content/posts/*.md',
        sortBy: 'date',
        reverse: true
    }
}))
//...
```
<div class="note--small">Full diff can be found [here](https://github.com/RobinThrift/metalsmith-tutorial/commit/12c88cd4845fe6e6043766f50af552a5ead8cbde)</div>

Here we make use of metalsmith-collections options to sort the posts by date and reverse the order, so the newest are first.


###Collections in Templates
Our collections are kind of useless (except for the permalinks) without displaying them, so let's change that. We are going to add a page that lists all of our blog posts, so create a file called `blog.md` in your `src/content/pages` folder and add the following content:

```markdown
---
title: Blog
template: blog.hbt
---
```

And create the template (`templates/blog.hbt`):

```handlebars
{{> header}}
<h2>{{title}}</h2>

<article>
    <ul>
        {{#each collections.posts}}
            <li>
                <h3>{{this.title}}</h3>
                <article>{{this.contents}}</article>
            </li>
        {{/each}}
    </ul>
</article>

{{> footer}}
```

Now you have a list of all your articles ordered by date, newest first.


###Keep the Flame going
That's all for now, but next time we will expand our knowledge on collections, look into pagination and have some more fun with Metalsmith's internals.

The full source code for this part of the tutorial can be found [here](https://github.com/RobinThrift/metalsmith-tutorial/tree/END-OF-PART-2)


#####Update:
You can find the next post in this series here: [Metalsmith Part 3: Shaping The Metal](http://www.robinthrift.com/posts/metalsmith-part-3-refining-our-tools/)
