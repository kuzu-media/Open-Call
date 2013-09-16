/* global OpenCall */
/*jshint devel:true */

OpenCall.controller("Events",['angularFireCollectionExtended','FIREBASE_URL','$scope','$filter',function(angularFireCollectionExtended,FIREBASE_URL,$scope,$filter)
{
	angularFireCollectionExtended(FIREBASE_URL+"categories/sub").then(function(subcategories)
	{
		$scope.subcategories = subcategories;
	});
	angularFireCollectionExtended(FIREBASE_URL+"events").then(function(events)
	{
		$scope.events = events;
	});
	$scope.event = {};

	$scope.event.date = $filter('date')(new Date(), "MM/dd/yy");
	$scope.event.time = $filter('date')(new Date(), "hh:mm a");
	console.log('$scope.event.time',$scope.event.time);

	$scope.create = function()
	{
		$scope.events.add($scope.event);
	};
}
]);