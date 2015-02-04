'use strict';

// Controllers
var deezerImportControllers = angular.module('deezerImportControllers', ['ngTable']);

deezerImportControllers.controller('DeezerController', ['$scope', 'DeezerSearch', 'DeezerHistory', '$filter', 'ngTableParams', 
	function ($scope, DeezerSearch, DeezerHistory, $filter, ngTableParams) {
		$scope.userName = 'titixies';
		// get it from http://developers.deezer.com/api/explorer
		$scope.accessToken = 'frkEeL2Zzr54d29d523e896DitEZwXA54d29d523e8cdwnV8lRM';
		$scope.deezerUser = {};
		var deezerTracks = [];
		$scope.pagesLoaded = 0;
		
		// cf. http://stackoverflow.com/questions/19674125/how-do-i-filter-a-row-based-on-any-column-data-with-single-textbox/19676463#19676463
		$scope.trackFilter = '';
		$scope.$watch('trackFilter', function () {
			$scope.tableParams.reload();
		});
		
		$scope.tableParams = new ngTableParams({
			page: 1,
			count: 25,
			sorting: {
				timestamp: 'asc'
			}
		}, {
			total: deezerTracks.length,
			getData: function($defer, params) {
				// use build-in angular filter
				var filteredData = $scope.trackFilter ? $filter('filter')(deezerTracks, $scope.trackFilter) : deezerTracks;
				var orderedData = params.sorting() ? $filter('orderBy')(filteredData, params.orderBy()) : filteredData;
				$defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
			}
		})

		$scope.searchUser = function() {
			console.log('Searching Deezer for user ' + $scope.userName);
			
			// Call deezer search
			DeezerSearch.get({q: $scope.userName}, function(data) {
				$scope.deezerUser = data.data[0];
				console.log('Found user ' + $scope.deezerUser.id);

				// retrieve history
				$scope.getUserHistory();
			});
		}

		$scope.getUserHistory = function() {
			console.log('Getting history for user ' + $scope.deezerUser.name);
			var indexToLoad = 50 * $scope.pagesLoaded;

			DeezerHistory.get({userId: $scope.deezerUser.id, access_token: $scope.accessToken, index: indexToLoad}, function(data) {
				if (!data.error) {
					deezerTracks = deezerTracks.concat(data.data);
					$scope.tableParams.reload();
					$scope.pagesLoaded++;
				} else {
					console.error('Deezer history returned error : ' + data.error.message);
				}
			});
		}
	}
]);

deezerImportControllers.controller('LastfmController', ['$scope', 'LastfmService', 
	function ($scope, LastfmService) {
		$scope.userName = 'titix29';
		// cf. http://www.lastfm.fr/api/accounts
		$scope.api_key = '0d464d63b340f345585d8321599a91c4';
		var secret = 'FILL-ME';
		$scope.accessToken = 'fe54022c4ddb5bd926784db98bebdda5';
		$scope.lastfmUser = {};
		$scope.session = {};

		$scope.searchUser = function() {
			console.log('Searching Lastfm for user ' + $scope.userName);
			
			// Call last.fm search
			LastfmService.get($scope.userName, $scope.api_key)
				.success(function(data) {
					$scope.lastfmUser = data.user;
					console.log('Found user ' + $scope.lastfmUser.name);
					
					$scope.getToken();
				});
		}
		
		$scope.getToken = function() {
			LastfmService.getToken($scope.api_key, secret, function(data) {
				console.log('getToken returned : ' + data.token);
				$scope.accessToken = data.token;
				
				// needed because we are in a sub-function ?
				$scope.$apply();
			});
		}
		
		$scope.getSession = function() {
			LastfmService.getSession($scope.accessToken, $scope.api_key, secret, function(data) {
				console.log('getSession returned : ' + data.session);
				$scope.session = data.session;
				$scope.$apply();
			});
		}
		
		$scope.sendTracks = function() {
			var deezerDiv = document.getElementById('deezerDiv');
			var deezerScope = angular.element(deezerDiv).scope();
		
			// convert deezer to lastfm tracks
			var lastfmTracks = deezerScope.tableParams.data.map(function(track) {
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
				LastfmService.sendTracks(lastfmTracks.splice(0, batchSize), $scope.session, $scope.api_key, secret);
			}
			
			// DEBUG : send last track only
			// LastfmService.sendTracks(lastfmTracks[0], $scope.session, $scope.api_key, secret);
		}
	}
]);
