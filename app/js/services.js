'use strict';

// Services
var deezerImportServices = angular.module('deezerImportServices', ['ngResource']);

// Deezer API does not support CORS so we need to use JSONP to retrieve data
deezerImportServices.factory('DeezerSearch', ['$resource', 
	function($resource) {
		// output get param is for Deezer to return JSONP content
		return $resource('http://api.deezer.com/search/user', {callback: 'JSON_CALLBACK', output: 'jsonp'}, {
			// JSONP method is for Angular.js to process JSONP content
			get: {method: 'JSONP'}
		});
	}
]);

deezerImportServices.factory('DeezerHistory', ['$resource', 
	function($resource) {
		return $resource('http://api.deezer.com/user/:userId/history', {callback: 'JSON_CALLBACK', output: 'jsonp'}, {
			get: {method: 'JSONP'}
		});
	}
]);

/*
deezerImportServices.factory('LastfmService', ['$resource', 
	function($resource) {
	
	}
]);
*/