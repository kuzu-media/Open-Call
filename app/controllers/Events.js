/* global OpenCall */
/*jshint devel:true */

OpenCall.controller("Events",['angularFireCollectionExtended','FIREBASE_URL','$scope','$filter','$routeParams','$rootScope','$location',function(angularFireCollectionExtended,FIREBASE_URL,$scope,$filter,$routeParams,$rootScope,$location)
{
	angularFireCollectionExtended(FIREBASE_URL+"categories/sub").then(function(subcategories)
	{
		$scope.subcategories = subcategories;
	});
	angularFireCollectionExtended(FIREBASE_URL+"events").then(function(events)
	{
		$scope.events = events;
		if($routeParams.event_id)
		{
			$scope.event = events.getByName($routeParams.event_id);
			$rootScope.page_title = $scope.event.title;
		}
	});
	$scope.event = {};


	$scope.event.date = $filter('date')(new Date(), "MM/dd/yy");
	$scope.event.time = $filter('date')(new Date(), "hh:mm a");

	$scope.create = function()
	{
		$scope.event.attendee_count = 0;
		$scope.event.host = {};
		$scope.event.host.name = $rootScope.user_info.first_name + " " + $rootScope.user_info.last_name;
		$scope.event.host.id = $rootScope.user_info.$id;
		$scope.events.add($scope.event);
		$scope.event = {};
		$location.path('/');
	};

	$scope.join = function()
	{
		if(typeof $scope.event.requests === "undefined")
		{
			$scope.event.requests = [];
		}
		$scope.event.requests.push($rootScope.user_info.$id);
		$scope.events.update($scope.event);

		angularFireCollectionExtended(FIREBASE_URL+"notifications/"+$scope.event.host.id).then(function(notifications)
		{
			var not = {
					type: 1,
					event_id: $scope.event.$id,
					user_id: $rootScope.user_info.$id
				};
			notifications.add(not);
		});
	};
}
]);