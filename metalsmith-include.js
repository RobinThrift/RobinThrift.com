


var include = function(opts) {
    opts = opts || {};
    var filePattern = opts.filePatter || /.js$/;
        incPattern  = opts.incPatter || /^(?:.*=\s*(?:require)\s+([\w\.\/-]+))$/gm; // ^(.*=\s*(require)\s+([\w\.\/-]+))\.js$

    return function(files, metalsmith, done) {
        var matched  = false,
            includes = [],
            file, cont, matches, incData;

        for (file in files) {
            if (filePattern.test(file)) {
                matched = false;
                incData = new Buffer('');
                cont    = files[file].contents.toString();

                while (matches = incPattern.exec(cont)) {
                    includes.push(matches[1]);
                    incData = Buffer.concat([incData, files[matches[1]].contents]);
                    matched = true;
                }

                if (matched) {
                    incData = Buffer.concat([incData, files[file].contents]);

                    files[file].contents = incData;
                }
            }

        }

        for (file in files) {
            if (includes.indexOf(file) != -1) {
                delete files[file];
            }
        }

        done();
    }
}


module.exports = include;