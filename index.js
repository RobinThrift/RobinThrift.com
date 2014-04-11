var Metalsmith  = require('metalsmith'),
    markdown    = require('metalsmith-markdown'),
    template    = require('metalsmith-templates'),
    sass        = require('metalsmith-sass'),
    permalinks  = require('metalsmith-permalinks'),
    excerpts    = require('metalsmith-excerpts'),
    collections = require('metalsmith-collections'),
    hljs        = require('highlight.js'),
    Handlebars  = require('handlebars'),
    moment      = require('moment'),
    paginate    = require('metalsmith-paginate'),
    uglify      = require('metalsmith-uglify'),
    include     = require('./metalsmith-include'),
    fs          = require('fs');


Handlebars.registerPartial('header', fs.readFileSync(__dirname + '/templates/partials/header.hbt').toString());
Handlebars.registerPartial('footer', fs.readFileSync(__dirname + '/templates/partials/footer.hbt').toString());
Handlebars.registerPartial('sidebar', fs.readFileSync(__dirname + '/templates/partials/sidebar.hbt').toString());

Handlebars.registerHelper('xmldate', function(date) {
    return moment(date).format('ddd, DD MMM YYYY HH:mm:ss ZZ');
});

Handlebars.registerHelper('date', function(date) {
    return moment(date).format('Do MMMM YYYY');
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
        // console.log(files);
        for (var file in files) {
            if (/index/.test(file)) {
                console.log(file, files[file]);
            }
        }
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
    .metadata(require('./config.json'))
    .use(filter())
    .use(collections({
        posts: {
            pattern: 'content/posts/*.md',
            sortBy: 'date',
            reverse: true
        },
        pages: {
            pattern: 'content/pages/*.md'
        }
    }))
    .use(paginate({
        perPage: 10,
        path: 'blog/page'
    }))
    .use(excerpts())
    .use(markdown({
        gfm: true,
        tables: true,
        breaks: true,
        smartLists: true,
        smartypants: true,
        highlight: function (code, lang, callback) {
            return require('highlight.js').highlightAuto(code).value
        }
    }))
    // .use(debug())
    .use(permalinks({
        pattern: 'posts/:title',
        relative: true
    }))
    // .use(debug())
    .use(template('handlebars'))
    // .use(debug())
    .use(sass({
        outputStyle: 'expanded'
    }))
    .use(include())
    .use(uglify({
        concat: 'js/init_grid.js'
    }))

    .destination('./build')
    .build();
