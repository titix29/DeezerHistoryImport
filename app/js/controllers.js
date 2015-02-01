'use strict';

// Controllers
var deezerImportControllers = angular.module('deezerImportControllers', []);

deezerImportControllers.controller('DeezerController', ['$scope', 'DeezerSearch', 
	function ($scope, DeezerSearch) {
		$scope.userName = ''
		$scope.user = {}

		$scope.searchUser = function() {
			console.log('Searching Deezer for user ' + $scope.userName)
			
			// Call deezer search
			DeezerSearch.get({q: $scope.userName}, function(data) {
				$scope.deezerUser = data.data[0];
				
				console.log('Found user ' + $scope.deezerUser.id);
			});
		}
	}
]);