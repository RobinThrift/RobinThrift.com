//= require js/angular/angular.min.js


var App = angular.module('RobinThrift.App', ['ngRoute']);

App.config(function($routeProvider) {
    $routeProvider.otherwise('/');

    $routeProvider.when('/posts/:id', {
        templateUrl: 'post.tpl.html',
        controller: 'RobinThrift.PostCntrl'
    });

});

App.controller('RobinThrift.PostCntrl', function($scope, $routeParams) {
   console.log($routeParams); 
});
