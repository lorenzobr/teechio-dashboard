(function(window, document, undefined) {
	'use strict';

	var teechioDashboard = angular.module('teechioDashboard', ['ngRoute']);

	var themepath = '/public/';

	teechioDashboard.config(
		function($interpolateProvider) { 
			$interpolateProvider.startSymbol('{[').endSymbol(']}') 
		}
	);
	
	teechioDashboard.config(
		function($routeProvider, $locationProvider) { 
			$routeProvider
				.when('/', {
					templateUrl: themepath + 'partials/home.html',
					controller: 'DashboardController'
				})
				.when('/walkthrough', {
					templateUrl: themepath + 'partials/walkthrough.html',
					controller: 'WalkthroughController'
				})
				.when('/apps/:id', {
					templateUrl: themepath + 'partials/applications.html',
					controller: 'ApplicationsController'
				})
				.when('/settings', {
					templateUrl: themepath + 'partials/settings.html',
					controller: 'SettingsController'
				});

			$locationProvider
				.html5Mode(true);
		}
	);
	
	teechioDashboard.factory('$acache', [ '$cacheFactory', function($cacheFactory) {
		return {
			get: function(key) {
				var cache = localStorage.getItem(key);
				try {
					cache = JSON.parse(localStorage.getItem(key));
					return cache;
				}
				catch(err) { return cache }
			},
			put: function(key, value) {
				(typeof value === 'string') 
				? localStorage.setItem(key, value) : localStorage.setItem(key, JSON.stringify(value));
			},
			remove: function(key) {
				localStorage.removeItem(key);
			}
		}
	}]);
	
	window.teechioDashboard = teechioDashboard;
})(window, document);