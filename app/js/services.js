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
		
		getToken: function(successFn) {
			var srv = getLastFM();
			srv.auth.getToken({success: successFn});
		},
		
		sendTracks: function(tracks, successFn, errorFn) {
			// cf. process in http://www.lastfm.fr/api/desktopauth (our app is not web-visible)
			
			
			var lastfmErrorFn = function(data) {
				console.error(data);
			};
			
			var sessionSuccessFn = function(data) {
				console.log('Session token : ' + data);
			};
			
			var tokenSuccessFn = function(data) {
				var token = data;
				console.log('LastFM token : ' + token);
				// lastFM.auth.getSession(token, {success: sessionSuccessFn, error: lastfmErrorFn});
			};
			
			// launch last.fm calls
			// lastFM.auth.getToken({success: tokenSuccessFn, error: lastfmErrorFn});
		}
	}
}]);

function getLastFM() {
	var key = '0d464d63b340f345585d8321599a91c4';
	var secret = 'e59e0067bd6bd8979401ad733a151f65';
	var lastFM = new LastFM({
		apiKey: key,
		apiSecret: secret
	});
	console.log('Created lastFM object: ' + lastFM);
	
	return lastFM;
}