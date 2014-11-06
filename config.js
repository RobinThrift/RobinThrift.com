

var prod = {
        'sitename': 'Robin Thrift',
        'baseUrl': 'http://www.robinthrift.com',
        'description': 'My personal blog'
    },
    dev = {
        'sitename': 'Robin Thrift (DEV)',
        'baseUrl': 'http://localhost:3000',
        'description': 'My personal blog'
    };

module.exports = function(args) {
    'use strict';
    var config = dev;

    args.forEach(function(val) {
        if (val === '--prod' || val === '-p') {
            config = prod; 
        } 
    });

    return config;

};
