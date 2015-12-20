var prod = {
    'sitename': 'Robin Thrift',
    'baseUrl': 'http://www.robinthrift.com',
    'description': 'My personal blog',
    'isDev': false,
    'twitter': 'RobinThrift',
    'github': 'RobinThrift'
};
var dev = {
    'sitename': 'Robin Thrift',
    'baseUrl': 'http://localhost:3000',
    'description': 'My personal blog',
    'isDev': true,
    'twitter': 'RobinThrift',
    'github': 'RobinThrift'
};

module.exports = function(args) {
    var config = dev;
    args.forEach(function(val) {
        if (val === '--prod' || val === '-p') {
            config = prod;
        }
    });
    return config;
};
