'use strict';

/*
TODOs : 
	- test full JS deployment using node.js (http://azure.microsoft.com/fr-fr/documentation/articles/web-sites-nodejs-develop-deploy-mac/)
	- fix bug when filtering results : filter applies to whole data including deezer album (which is not displayed)
	- include HTML5 best practices
	- Error management
*/

/*
NOTES : 
	- last.fm returns error when scrobbling tracks to far in the past (2 weeks), cf. https://twitter.com/lastfmsupport/status/400948218764472320
*/

// Controllers
var deezerImportControllers = angular.module('deezerImportControllers', ['ngTable']);

deezerImportControllers.controller('DeezerController', ['$scope', '$filter', 'ngTableParams', 'DeezerSearch', 'DeezerHistory', 
	function ($scope, $filter, ngTableParams, DeezerSearch, DeezerHistory) {
		var vm = this;
	
		vm.userName = 'titixies';
		// get it from http://developers.deezer.com/api/explorer
		vm.accessToken = 'frsnOWMvL654fabfcfc8383Az9tkson54fabfcfc88a0tY8NdF9';
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

		vm.searchUser = function() {
			console.log('Searching Deezer for user ' + vm.userName);
			
			// Call deezer search
			DeezerSearch.get({q: vm.userName}, function(data) {
				vm.deezerUser = data.data[0];
				console.log('Found user ' + vm.deezerUser.id);

				// retrieve history
				vm.getUserHistory();
			});
		}

		vm.getUserHistory = function() {
			console.log('Getting history for user ' + vm.deezerUser.name);
			var indexToLoad = 50 * vm.pagesLoaded;

			DeezerHistory.get({userId: vm.deezerUser.id, access_token: vm.accessToken, index: indexToLoad}, function(data) {
				if (!data.error) {
					vm.deezerTracks = vm.deezerTracks.concat(data.data);
					$scope.tableParams.reload();
					vm.pagesLoaded++;
				} else {
					console.error('Deezer history returned error : ' + data.error.message);
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
	}
]);

deezerImportControllers.controller('LastfmController', ['$scope', 'LastfmService', 
	function ($scope, LastfmService) {
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
			vm.session = {key: window.location.search.substring(debugIndex + "session=".length) };
		} else {
			vm.session = {};
		}

		vm.searchUser = function() {
			console.log('Searching Lastfm for user ' + vm.userName);
			
			// Call last.fm search
			LastfmService.get(vm.userName, vm.api_key)
				.success(function(data) {
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
				LastfmService.sendTracks(lastfmTracks.splice(0, batchSize), vm.session, vm.api_key, vm.secret);
			}
		}
		
		// Retrieve last track
		vm.getLastTrack();
	}
]);
