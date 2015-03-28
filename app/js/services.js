'use strict';

// Services
var deezerImportServices = angular.module('deezerImportServices', []);

var deezerRoot = 'https://api.deezer.com';
var lastfmRoot = 'https://ws.audioscrobbler.com/2.0/';

deezerImportServices.factory('DeezerSearch', ['$http', function($http) {
	return {
		getUser: function(userName) {
			// Deezer API does not support CORS so we need to use JSONP to retrieve data
			return $http.jsonp(deezerRoot + '/search/user', {
				params : {
					q: userName,
					// enable angularjs JSONP
					callback: 'JSON_CALLBACK',
					// force Deezer to return JSONP content
					output: 'jsonp'
				}
			});
		},
		
		getUserHistory: function(userId, accessToken, indexToLoad) {
			var url = '/user/' + userId + '/history';
			return $http.jsonp(deezerRoot + url, {
				params : {
					access_token: accessToken,
					index: indexToLoad,
					callback: 'JSON_CALLBACK',
					output: 'jsonp'
				}
			});	
		}
	}
}]);

deezerImportServices.factory('LastfmService', ['$http', function($http) {
	return {
		get: function(userName, apiKey) {
			return $http.get(lastfmRoot, {
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
		
		getRecentTracks: function(userName, apiKey, secret, successFn) {
			var srv = getLastFM(apiKey, secret);
			srv.user.getRecentTracks({user: userName}, {success: successFn});
		},
		
		sendTracks: function(tracks, session, apiKey, secret, successFn, errorFn) {
			var srv = getLastFM(apiKey, secret);
			srv.track.scrobble(tracks, session, {success: successFn, error: errorFn});
		}
	}
}]);

function getLastFM(key, secret) {
	return new LastFM({
		apiKey: key,
		apiSecret: secret,
		apiUrl: lastfmRoot
	});
}