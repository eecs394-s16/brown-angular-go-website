// new dependency: ngResource is included just above
var myapp = angular.module("myapp", ["ngResource", "ui.bootstrap", "spotify"]);
myapp.controller("MainCtl", ["$scope", "$resource", "$filter", "Spotify", function($scope, $resource, $filter, Spotify){
	Spotify.getTrack('0eGsygTp906u18L0Oimnem').then(function (data) {
  		console.log(data);
	});
	//TODO: Fix the playing song so it can not be adjusted in the queue
	var Song = $resource("/songs/:id", {id: '@id'}, {});
	//var playerState = 'stop';
	$scope.topSong = null;
	$scope.playing = false;
	$scope.selected = null;
	$scope.list = function(id){
		Song.query(function(data){
			$scope.songs = data.slice(1);
			$scope.topSong = data[0];
			// TODo: something like below for fixating the top value?
			// $scope.remove(data[0].id);
			// if(idx != undefined) {
			// 	$scope.selected = $scope.songs[idx];
			// 	$scope.selected.idx = idx;
			// }
			console.log($scope.topSong);
		}, function(error){
			alert(error.data);
		});
	};
	$scope.list();
	$scope.get = function(id){
		var song = $filter("filter")($scope.songs, {id: id})[0];
		Song.get({id: song.id}, function(data){
			$scope.selected = data;
			$scope.selected.id = id;
		});

		buttonPlayPress(id);
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
$scope.liked = [];
	for (var i = 0; i < 100; i++) $scope.liked[i] = false;
	$scope.like = function(id){
		
		$scope.liked[id]= !$scope.liked[id];
		var song = $filter("filter")($scope.songs, {id: id})[0];
		console.log('song', song);
		($scope.liked[id])? song.votes = song.votes + 1:song.votes = song.votes -1;
		song.$save();
    	$scope.list(id);

	};
	$scope.remove = function(id){
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

myapp.controller('NavCtrl', function($scope) {
	$scope.state = false;

	$scope.toggleState = function() {
		$scope.state = !$scope.state;
	};
});

myapp.directive('sidebarDirective', function() {
	return {
		link: function (scope, element, attr) {
			scope.$watch(attr.sidebarDirective, function(newVal) {
				if(newVal) {
					element.addClass('show');
					return;
				}
				element.removeClass('show');
			});
		}
	};
});

myapp.directive('tab', function() {
	return {
		restrict: 'E',
		transclude: true,
		template: '<div role="tabpanel" ng-show="active" ng-transclude></div>',
		require: '^tabset',
		scope: {
			heading:'@'
		},
		link: function(scope, elem, attr, tabsetCtrl) {
			scope.active = false

			scope.disabled = false
			if(attr.disable) {
				attr.$observe('disable', function(value) {
					scope.disabled = (value !== 'false')
				})
			}

			tabsetCtrl.addTab(scope)
		}
	}
});
myapp.directive('tabset', function() {
	return {
		restrict: 'E',
		transclude: true,
		scope: {
			type:'@',
			vertical:'@',
			justified:'@',
		},
		templateUrl: 'tabset.html',
		bindToController: true,
		controllerAs: 'tabset',
		controller: function() {
			var self = this
			self.tabs = []
			self.addTab = function addTab(tab) {
				self.tabs.push(tab)

				if (self.tabs.length == 1) {
					tab.active = true;
				}
			}

			self.classes = {}
			if (self.type == 'pills') {
				self.classes['nav-pills'] = true 
			} else { 
				self.classes['nav-tabs'] = true 
			}

			if (self.justified) {
				self.classes['nav-justified'] = true
			}
			if (self.vertical) {
				self.classes['nav-stacked'] = true
			}

			self.select = function(selectedTab) {

				if (selectedTab.disabled) { return }

				angular.forEach(self.tabs, function(tab){
					if(tab.active && tab != selectedTab) {
						tab.active = false;
					}
				})

				selectedTab.active = true;
			}

		}
	}
});
myapp.controller('NavCtrl', function($scope) {
	$scope.state = false;

	$scope.toggleState = function() {
		$scope.state = !$scope.state;
	};
});
myapp.directive('sidebarDirective', function() {
	return {
		link: function (scope, element, attr) {
			scope.$watch(attr.sidebarDirective, function(newVal) {
				if(newVal) {
					element.addClass('show');
					return;
				}
				element.removeClass('show');
			});
		}
	};
});