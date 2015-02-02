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

deezerImportServices.factory('LastfmService', ['$http', function($http) {
	return {
		get: function(userName, apiKey) {
			return $http.get('http://ws.audioscrobbler.com/2.0', {
				params: {
					method: 'user.getinfo', 
					format: 'json',
					user: userName,
					api_key: apiKey
				}
			});
		},
		
		getToken: function(apiKey, secret, successFn) {
			var srv = getLastFM(apiKey, secret);
			srv.auth.getToken({success: successFn});
		},
		
		getSession: function(accessToken, apiKey, secret, successFn) {
			var srv = getLastFM(apiKey, secret);
			srv.auth.getSession({token: accessToken}, {success: successFn});
		},
		
		// NOTE: this POST request never returns data (JS API limitation) so no callback is passed 
		// (check https://github.com/fxb/javascript-last.fm-api "Write methods")
		// To debug : check network traffic with Chrome
		sendTracks: function(tracks, session, apiKey, secret) {
			var srv = getLastFM(apiKey, secret);
			srv.track.scrobble(tracks, session);
		}
	}
}]);

function getLastFM(key, secret) {
	return new LastFM({
		apiKey: key,
		apiSecret: secret
	});
}