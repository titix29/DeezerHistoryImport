'use strict';

/*
TODOs : 
	- test full JS deployment using node.js (http://azure.microsoft.com/fr-fr/documentation/articles/web-sites-nodejs-develop-deploy-mac/)
	- fix bug when filtering results : filter applies to whole data including deezer album (which is not displayed)
	- include HTML5 best practices
*/

/*
NOTES : 
	- last.fm returns error when scrobbling tracks to far in the past (2 weeks), cf. https://twitter.com/lastfmsupport/status/400948218764472320
*/

// Controllers
var deezerImportControllers = angular.module('deezerImportControllers', ['ngTable', 'ngAnimate', 'toaster', 'xml'])
										.config(function ($httpProvider) {
											// JSON <=> XML conversion
											// https://github.com/johngeorgewright/angular-xml
											$httpProvider.interceptors.push('xmlHttpInterceptor');
										});

deezerImportControllers.controller('DeezerController', ['$scope', '$filter', 'ngTableParams', 'toaster', 'DeezerSearch',
	function ($scope, $filter, ngTableParams, toaster, DeezerSearch) {
		var vm = this;
	
		vm.userId = '2893644';
		// get it from http://developers.deezer.com/api/explorer
		vm.accessToken = '';
		vm.deezerUser = {};
		
		vm.deezerTracks = [];
		// used for Deezer query pagination
		vm.pagesLoaded = 0;
		
		// cf. http://stackoverflow.com/questions/19674125/how-do-i-filter-a-row-based-on-any-column-data-with-single-textbox/19676463#19676463
		vm.trackFilter = '';
		$scope.$watch('vm.trackFilter', function () {
			$scope.tableParams.reload();
		});
		
		$scope.tableParams = new ngTableParams({
			page: 1,
			count: 25,
			sorting: {
				timestamp: 'desc'
			}
		}, {
			total: 0,
			getData: function($defer, params) {
				// update total
				params.total(vm.deezerTracks.length);
			
				// use build-in angular filter
				var filteredData = vm.trackFilter ? $filter('filter')(vm.deezerTracks, vm.trackFilter) : vm.deezerTracks;
				var orderedData = params.sorting() ? $filter('orderBy')(filteredData, params.orderBy()) : filteredData;
				$defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
			}
		})
		
		vm.getToken = function() {
			console.log('Retrieving Deezer token');
			
			DeezerSearch.getToken().success(function(response) {
				if (response.status == 302)
				{
					// example : Location:https://xcllab.azurewebsites.net#access_token=XXX&expires=0
					var location = response.headers("Location");
					var tokenIndex = location.indexOf("access_token=");
					var start = tokenIndex + "access_token=".length;
					// TODO : refactor with similar code in last.fm case
					vm.accessToken = location.substring(start, start + 51);
				}
				else
				{
					console.log('Unable to retrieve Deezer token from response code ' + response.status + ' and status text : ' + response.statusText);
				}
			}).error(function(response) {
				if (response == null)
				{
					console.log('Unable to retrieve Deezer token, probably because of CORS policy / security on Deezer side');
				}
				else
				{
					console.log('Unable to retrieve Deezer token from response code ' + response.status + ' and status text : ' + response.statusText);
				}
			});
		}

		vm.getUser = function() {
			console.log('Searching Deezer for user ' + vm.userId);
			
			// Call deezer search
			DeezerSearch.getUser(vm.userId, vm.accessToken).success(function(data) {
				vm.deezerUser = data;
				console.log('Found user ' + vm.deezerUser.id);

				// retrieve history
				vm.getUserHistory();
			});
		}

		vm.getUserHistory = function() {
			console.log('Getting history for user ' + vm.deezerUser.name);
			var indexToLoad = 50 * vm.pagesLoaded;

			DeezerSearch.getUserHistory(vm.deezerUser.id, vm.accessToken, indexToLoad).success(function(data) {
				if (!data.error) {
					vm.deezerTracks = vm.deezerTracks.concat(data.data);
					$scope.tableParams.reload();
					vm.pagesLoaded++;
				} else {
					toaster.pop('error', 'Deezer history KO', '[' + data.error.code + '] : ' + data.error.message);
				}
			});
		}
		
		vm.isHistoryVisible = function() {
			return vm.deezerTracks.length > 0;
		}
		
		vm.selectAllTracks = function() {
			vm.deezerTracks.forEach(function(track) {
				track.selected = !track.selected;
			});
		}
		
		// Select all tracks that have not been scrobbled
		vm.smartSelectTracks = function() {
			// cf. http://stackoverflow.com/questions/25417162/how-do-i-inject-a-controller-into-another-controller-in-angularjs
			var lastfmDiv = document.getElementById('lastfmDiv');
			var lastfmScope = angular.element(lastfmDiv).scope();
			var lastScrobble = lastfmScope.vm.lastTrack.date.uts;
			vm.deezerTracks.forEach(function(track) {
				track.selected = track.timestamp > lastScrobble;
			});
		}
		
		vm.selectedTracksNb = function() {
			return vm.deezerTracks.filter(function(tr) {
				return tr.selected
			}).length;
		}
		
		// Retrieve Deezer token if user is already connected to the service (OAuth)
		// DOES NOT WORK vm.getToken();
	}
]);

deezerImportControllers.controller('LastfmController', ['$scope', 'toaster', 'LastfmService', 
	function ($scope, toaster, LastfmService) {
		var vm = this;
		
		vm.userName = 'titix29';
		// cf. http://www.lastfm.fr/api/accounts
		vm.api_key = '0d464d63b340f345585d8321599a91c4';
		vm.secret = '';
		vm.accessToken = '';
		
		vm.lastfmUser = {};
		vm.lastTrack = {};
		
		// cannot use $location.search() here (cf. https://github.com/angular/angular.js/issues/1417)
		var debugIndex = window.location.search.indexOf("session="); 
		var debugMode = debugIndex > -1;
		if (debugMode) {
			// awful way to retrive query parameter from URL...
			var start = debugIndex + "session=".length;
			vm.session = {key: window.location.search.substring(start, start + 32) };
			
			var secretIndex = window.location.search.indexOf("secret=");
			start = secretIndex + "secret=".length;
			vm.secret = window.location.search.substring(start, start + 32);
		} else {
			vm.session = {};
		}

		vm.searchUser = function() {
			console.log('Searching Lastfm for user ' + vm.userName);
			
			// Call last.fm search
			LastfmService.get(vm.userName, vm.api_key).success(function(data) {
				vm.lastfmUser = data.user;
				console.log('Found user ' + vm.lastfmUser.name);
				
				vm.getToken();
			});
		}
		
		vm.getToken = function() {
			LastfmService.getToken(vm.api_key, vm.secret, function(data) {
				console.log('getToken returned : ' + data.token);
				vm.accessToken = data.token;
				
				// needed because we are in a sub-function ?
				$scope.$apply();
			});
		}
		
		vm.getTokenValidationUrl = function() {
			return "http://www.last.fm/api/auth/?api_key=" + vm.api_key + "&token=" + vm.accessToken;
		}
		
		vm.getSession = function() {
			LastfmService.getSession(vm.accessToken, vm.api_key, vm.secret, function(data) {
				console.log('getSession returned : ' + data.session);
				vm.session = data.session;
				$scope.$apply();
			});
		}
		
		vm.getLastTrack = function() {
			LastfmService.getRecentTracks(vm.userName, vm.api_key, vm.secret, function(data) {
				console.log('getLastTrackDate returned : ' + data.recenttracks);
				vm.lastTrack = data.recenttracks.track[0];
				$scope.$apply();
			});
		}
		
		vm.sendTracks = function() {
			// cf. http://stackoverflow.com/questions/25417162/how-do-i-inject-a-controller-into-another-controller-in-angularjs
			var deezerDiv = document.getElementById('deezerDiv');
			var deezerScope = angular.element(deezerDiv).scope();
		
			// convert selected deezer tracks to lastfm tracks
			var lastfmTracks = deezerScope.vm.deezerTracks
				.filter(function(track) { return track.selected; })
				.map(function(track) {
					return {
						artist: track.artist.name,
						track: track.title,
						timestamp: track.timestamp,
						album: track.album.title,
						chosenByUser: 1
					};
				});
			
			// last.fm supports 50 elements batches
			// cf. http://stackoverflow.com/questions/11318680/split-array-into-chunks-of-n-length for splicing
			var batchSize = 50;
			while(lastfmTracks.length > 0) {
				LastfmService.sendTracks(lastfmTracks.splice(0, batchSize), vm.session, vm.api_key, vm.secret, 
					function(data) {
						console.log('sendTracks returned : ' + data);
						toaster.pop('success', 'Scrobble OK', data.lfm.scrobbles._accepted + ' scrobble(s) sent');
					},
					function(errorCode, data) {
						console.error('sendTracks returned : ' + errorCode);
						toaster.pop('error', 'Scrobble KO', '[' + data.lfm.error._code + '] : ' + data.lfm.error);
					});
			}
		}
		
		// Retrieve last track
		vm.getLastTrack();
	}
]);
