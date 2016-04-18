// new dependency: ngResource is included just above
var myapp = new angular.module("myapp", ["ngResource", "ui.bootstrap"]);
myapp.controller("MainCtl", ["$scope", "$resource", "$filter", function($scope, $resource, $filter){

	//TODO: Create variable for popping off top song on liist and displaying in player
	var Song = $resource("/songs/:id", {id: '@id'}, {});
	//var playerState = 'stop';
	$scope.playing = false;
	$scope.selected = null;
	$scope.list = function(id){
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
	$scope.get = function(id){
		// NOAH added this to get the song by song.id not index in list
		var song = $filter("filter")($scope.songs, {id: id})[0];
		Song.get({id: song.id}, function(data){
			$scope.selected = data;
			$scope.selected.id = id;
		});

		buttonPlayPress(id);
		//buttonSongPlayPress(id);
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
	$scope.update = function(id) {
		// NOAH commented this out to update songs by song.id not position in list
		//var song = $scope.songs[idx];
		var song = $filter("filter")($scope.songs, {id: id})[0];
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
		$scope.list(id);
	};
		var i = 0;
	var like_states =[
	    { text : "rgb(221,221,221)" },
	    { text : "rgb(95,95,95)" }
	];

	$scope.currentLikeState = like_states[i];

	$scope.like = function(id){
		 i = (i + 1) % like_states.length;
    	$scope.currentLikeState = like_states[i];
		
		var song = $filter("filter")($scope.songs, {id: id})[0];
		console.log('song', song);
		(i==1)? song.votes = song.votes + 1:song.votes = song.votes -1;
		song.$save();
		$scope.list(id);


	};
	$scope.remove = function(id){
		//$scope.songs[idx].$delete();
		//$scope.selected = null;

		// NOAH added to remove song by song.id not list index
		var song = $filter("filter")($scope.songs, {id: id})[0];
		song.$delete();
		$scope.selected = null;
		$scope.list();
	};
	$scope.player = function(){
		if($scope.play){$scope.play = false;}
		else{$scope.play = true;}
	}
}]);