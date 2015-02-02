'use strict';

// Controllers
var deezerImportControllers = angular.module('deezerImportControllers', []);

deezerImportControllers.controller('DeezerController', ['$scope', 'DeezerSearch', 'DeezerHistory', 
	function ($scope, DeezerSearch, DeezerHistory) {
		$scope.userName = 'titixies';
		// get it from http://developers.deezer.com/api/explorer
		$scope.accessToken = 'frZwXUOfX854cfde31bedf837TfU4ql54cfde31bee38u1sdIk2';
		$scope.deezerUser = {};
		$scope.deezerTracks = {};

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

			DeezerHistory.get({userId: $scope.deezerUser.id, access_token: $scope.accessToken}, function(data) {
				if (!data.error) {
					$scope.deezerTracks = data.data;

					var nextUrl = data.next;
					console.log('Next url is : ' + nextUrl);
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
		$scope.accessToken = 'FILL-ME';
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
				
				// needed the 1st time (TODO: find out why)
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
		
			// convert last.fm to deezer track
			var lastfmTracks = deezerScope.deezerTracks.map(function(track) {
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
