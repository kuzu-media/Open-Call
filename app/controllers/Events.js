/* global OpenCall */
/*jshint devel:true */

OpenCall.controller("Events",['angularFire','firebaseRefManager','FIREBASE_URL','$scope','$filter','$routeParams','$rootScope','$location',function(angularFire,firebaseRefManager,FIREBASE_URL,$scope,$filter,$routeParams,$rootScope,$location)
{
	$scope.subcategories = {};
	$scope.events = {};
	var events_ref = firebaseRefManager(FIREBASE_URL+"events");
	angularFire(firebaseRefManager(FIREBASE_URL+"categories/sub"), $scope, 'subcategories');
	angularFire(events_ref,$scope,"events").then(function()
	{
		if($routeParams.event_id)
		{
			$scope.event = $scope.events[$routeParams.event_id];
			$scope.event.id = $routeParams.event_id;
			$rootScope.page_title = $scope.event.title;
		}
	});

	$scope.create = function()
	{
		$scope.event.attendee_count = 0;
		$scope.event.host = {};
		$scope.event.host.name = $rootScope.user.first_name + " " + $rootScope.user.last_name;
		$scope.event.host.id = $rootScope.user.id;
		$scope.events[events_ref.push().name()] = $scope.event;
		$scope.event = {};
		$location.path('/');
	};

	$scope.join = function()
	{
		if(typeof $scope.event.requests === "undefined")
		{
			$scope.event.requests = [];
		}
		$scope.event.requests.push($rootScope.user.id);

		angularFire(firebaseRefManager(FIREBASE_URL+"users/"+$scope.event.host.id),$scope,'host').then(function()
		{
			if(!$scope.host.notification_count){$scope.host.notification_count = 0;}
			$scope.host.notification_count++;
		});
		$scope.notifications = {};
		var not_ref = firebaseRefManager(FIREBASE_URL+"notifications/"+$scope.event.host.id);
		angularFire(not_ref,$scope,'notifications');

		var not = {
				type: 1,
				event_id: $scope.event.id,
				user_id: $rootScope.user.id
			};
		$scope.notifications[not_ref.push().name()] = not;
	};
}
]);