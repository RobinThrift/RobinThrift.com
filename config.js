

var prod = {
        'sitename': 'Robin Thrift',
        'baseUrl': 'http://www.robinthrift.com',
        'description': 'My personal blog',
        'isDev': false,
        'twitter': 'RobinThrift',
        'github': 'RobinThrift'
    },
    dev = {
        'sitename': 'Robin Thrift',
        'baseUrl': 'http://192.168.178.32:3000',
        'description': 'My personal blog',
        'isDev': true,
        'twitter': 'RobinThrift',
        'github': 'RobinThrift'
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
