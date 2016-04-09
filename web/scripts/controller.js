// new dependency: ngResource is included just above
var myapp = new angular.module("myapp", ["ngResource"]);
myapp.controller("MainCtl", ["$scope", "$resource", function($scope, $resource){

	var Song = $resource("/songs/:id", {id: '@id'}, {});
	$scope.selected = null;
	$scope.list = function(idx){
		Song.query(function(data){
			$scope.songs = data;
			// if(idx != undefined) {
			// 	$scope.selected = $scope.songs[idx];
			// 	$scope.selected.idx = idx;
			// }
		}, function(error){
			alert(error.data);
		});
	};
	$scope.list();
	$scope.get = function(idx){
		Song.get({id: $scope.songs[idx].id}, function(data){
			$scope.selected = data;
			$scope.selected.idx = idx;
		});
	};
	$scope.add = function() {
		var title = prompt("Enter the song's title.");
		if(title == null){
			return;
		}
		var artist = prompt("Enter the song's artist");
		if(artist == null){
			return;
		}
		var newSong = new Song();
		newSong.title = title;
		newSong.artist = artist;
		newSong.votes = 1;
		newSong.$save();
		$scope.list();
	};
	$scope.update = function(idx) {
		var song = $scope.songs[idx];
		var title = prompt("Enter a new title", song.title);
		if(title == null) {
			return;
		}
		var artist = prompt("Enter a new artist", song.artist);
		if(artist == null) {
			return;
		}
		song.title = title;
		song.artist = artist;
		song.$save();
		$scope.list(idx);
	};
	$scope.like = function(idx){
		var song = $scope.songs[idx];
		song.votes = song.votes + 1;
		song.$save();
		$scope.list(idx);

	};
	$scope.remove = function(idx){
		$scope.songs[idx].$delete();
		$scope.selected = null;
		$scope.list();
	};
}]);