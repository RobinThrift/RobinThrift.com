var Metalsmith  = require('metalsmith'),
    markdown    = require('metalsmith-markdown'),
    template    = require('metalsmith-templates'),
    sass        = require('metalsmith-sass'),
    permalinks  = require('metalsmith-permalinks'),
    excerpts    = require('metalsmith-excerpts'),
    collections = require('metalsmith-collections'),
    drafts      = require('metalsmith-drafts');
    hljs        = require('highlight.js'),
    Handlebars  = require('handlebars'),
    moment      = require('moment'),
    paginate    = require('metalsmith-paginate'),
    uglify      = require('metalsmith-uglify'),
    include     = require('./metalsmith-include'),
    metadata    = require('./config.json'),
    fs          = require('fs');


Handlebars.registerPartial('header', fs.readFileSync(__dirname + '/templates/partials/header.hbt').toString());
Handlebars.registerPartial('footer', fs.readFileSync(__dirname + '/templates/partials/footer.hbt').toString());
Handlebars.registerPartial('sidebar', fs.readFileSync(__dirname + '/templates/partials/sidebar.hbt').toString());

Handlebars.registerHelper('xmldate', function(date) {
    return moment(date).format('ddd, DD MMM YYYY HH:mm:ss ZZ');
});

Handlebars.registerHelper('sitemapdate', function(date) {
    return moment(date).format('YYYY-MM-DD');
});

Handlebars.registerHelper('date', function(date) {
    return moment(date).format('Do MMMM YYYY');
});

Handlebars.registerHelper('link', function(path) {
    return metadata.baseUrl + '/' + path;
});


Handlebars.registerHelper('limit', function(collection, limit, start) {
    var out   = [],
        i, c;

    start = start || 0;

    for (i = c = 0; i < collection.length; i++) {
        if (i >= start && c < limit+1) {
            out.push(collection[i]);
            c++;
        }
    }

    return out;
});


var debug = function() {
    return function(files, metalsmith, done){
        done();
    };
};

var filter = function() {
    return function(files, metalsmith, done) {
        for (var file in files) {
            if (file == '.htaccess') {
                continue;
            }
            
            if (/^([\._])|(\/([\._]).*?)/g.test(file)) {
                delete files[file];
            }
        }
        done();
    }
}


Metalsmith(__dirname)
    .metadata(metadata)
    .use(filter())
    .use(drafts())
    .use(collections({
        entries: {
            pattern: 'content/po*/*.md',
            sortBy: 'date',
            reverse: true
        },
        posts: {
            pattern: 'content/posts/*.md',
            sortBy: 'date',
            reverse: true
        },
        pages: {
            pattern: 'content/pages/*.md'
        },
        podcasts: {
            pattern: 'content/podcasts/*.md',
            sortBy: 'date',
            reverse: true
        }
    }))
    .use(paginate({
        perPage: 10,
        path: ':collection/page'
    }))
    .use(excerpts())
    .use(markdown({
        gfm: true,
        tables: true,
        breaks: true,
        smartLists: true,
        smartypants: true,
        highlight: function (code, lang, callback) {
            return hljs.highlightAuto(code).value
        }
    }))
    .use(permalinks({
        pattern: ':collection/:title',
        relative: true
    }))
    .use(template('handlebars'))
    .use(sass({
        outputStyle: 'expanded'
    }))
    .use(include())
    .use(uglify({
        concat: 'js/init_grid.js'
    }))
    .destination('./build')
    .build();
