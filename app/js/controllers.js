'use strict';

// Controllers
var deezerImportControllers = angular.module('deezerImportControllers', []);

deezerImportControllers.controller('DeezerController', ['$scope', 'DeezerSearch', 'DeezerHistory', 
	function ($scope, DeezerSearch, DeezerHistory) {
		$scope.userName = '';
		$scope.deezerAccessToken = 'frLhXvSvt054ce31a9d1108mBGcXxUu54ce31a9d114ctj3mm4j';
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

			DeezerHistory.get({userId: $scope.deezerUser.id, access_token: $scope.deezerAccessToken}, function(data) {
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