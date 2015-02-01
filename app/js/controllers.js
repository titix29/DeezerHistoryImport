'use strict';

// Controllers
var deezerImportControllers = angular.module('deezerImportControllers', []);

deezerImportControllers.controller('DeezerController', ['$scope', 'DeezerSearch', 'DeezerHistory', 
	function ($scope, DeezerSearch, DeezerHistory) {
		$scope.userName = '';
		$scope.accessToken = 'frLhXvSvt054ce31a9d1108mBGcXxUu54ce31a9d114ctj3mm4j';
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
		$scope.userName = '';
		// cf. http://www.lastfm.fr/api/accounts
		$scope.api_key = '0d464d63b340f345585d8321599a91c4';
		$scope.accessToken = '';
		$scope.lastfmUser = {};

		$scope.searchUser = function() {
			console.log('Searching Lastfm for user ' + $scope.userName);
			
			// Call last.fm search
			LastfmService.get({user: $scope.userName, api_key: $scope.api_key}, function(data) {
				$scope.lastfmUser = data.user;
				console.log('Found user ' + $scope.lastfmUser.name);
			});
		}
	}
]);