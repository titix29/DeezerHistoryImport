'use strict';

// Services
var deezerImportServices = angular.module('deezerImportServices', []);

var deezerRoot = 'https://api.deezer.com';
var deezerOAuth = 'https://connect.deezer.com/oauth/auth.php?';
var deezerAppId = 154441;
var deezerRedirect = 'https://xcllab.azurewebsites.net';
var lastfmRoot = 'https://ws.audioscrobbler.com/2.0/';

deezerImportServices.factory('DeezerSearch', ['$http', function($http) {
	return {
		getToken: function() {
			var url = deezerOAuth + 'app_id=' + deezerAppId + '&redirect_uri=' + deezerRedirect + '&response_type=token&perms=basic_access,email,listening_history,offline_access';
			console.log("Retrieving token from url : " + url);
			return $http.head(url);
		},
		
		getUser: function(userId, accessToken) {
			// Deezer API does not support CORS so we need to use JSONP to retrieve data
			// sometimes search/user api returns nothing depending on the current country :
			// see : http://stackoverflow.com/questions/24245128/why-deezer-search-api-is-not-returning-results-on-deployed-cloud-application?rq=1
			// so we search by id using the token instead
			return $http.jsonp('https://api.deezer.com/user/' + userId, {
				params : {
					access_token: accessToken,
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

deezerImportServices.factory('YoutubeService', ['$http', function($http) {
	return {
		getHistoryPlaylistId: function(apiKey, accessToken) {
			return $http.get('https://www.googleapis.com/youtube/v3/channels', {
				headers : {
					Authorization: 'Bearer ' + accessToken
				},
				params : {
					part: 'contentDetails',
					mine: true,
					key: apiKey
				}
			});
		},
		
		getPlaylistContent: function(apiKey, accessToken, playlistId) {
			return $http.get('https://www.googleapis.com/youtube/v3/playlistItems', {
				headers : {
					Authorization: 'Bearer ' + accessToken
				},
				params : {
					part: 'snippet',
					playlistId: playlistId,
					maxResults: 20,
					key: apiKey
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