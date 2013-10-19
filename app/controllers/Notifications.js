/* global OpenCall */
/*jshint devel:true */

OpenCall.controller("Notifications",['FIREBASE_URL','$rootScope','angularFire','firebaseRefManager','$scope','$location',function(FIREBASE_URL,$rootScope,angularFire,firebaseRefManger,$scope,$location)
{
	angularFire(firebaseRefManger(FIREBASE_URL+"notifications").child($rootScope.user_login.id),$scope,'notifications').then(function()
	{
		$scope.events = {};
		for (var not in $scope.notifications) {

			if($scope.notifications[not].type === 1)
			{

				var event_id = $scope.notifications[not].event_id;
				var user_id = $scope.notifications[not].user_id;

				$scope.events[event_id] = {};
				angularFire(firebaseRefManger(FIREBASE_URL+"events").child(event_id),$scope,'events',event_id);
				angularFire(firebaseRefManger(FIREBASE_URL+"users").child(user_id),$scope,'users',user_id);
			}
		}
	});

	$scope.view_acceptence = function(id,event_id)
	{
		console.log('id',id);
		// delete the notification for the current user
		delete_notification(id);

		// reduce the notification count
		reduce_count();

		$location.path("events/"+event_id);
	};

	// on acceptance of a notification
	$scope.accept = function(id)
	{

		var not = $scope.notifications[id];
		// increase attendee_count
		$scope.events[not.event_id].attendee_count++;

		// notify user of acceptance
		var new_not = not;
		new_not.type = 2;
		var new_not_ref = firebaseRefManger(FIREBASE_URL+"notifications").child(not.user_id);
		angularFire(new_not_ref,$scope,'accepted_user').then(function()
		{
			$scope.accepted_user[new_not_ref.push().name()] = new_not;
		});
		$scope.users[not.user_id].notification_count++;

		// set the user to attending
		update_attendee_status(not,2);

		// delete the notification for the current user
		delete_notification(id);

		// reduce the notification count
		reduce_count();


	};

	// on decline of a notification
	$scope.decline = function(id)
	{
		// set the status to declined
		update_attendee_status($scope.notifications[id],3);

		// delete the notification for the current user
		delete_notification(id);

		// reduce the notification count
		reduce_count();

	};

	var delete_notification = function(id)
	{
		delete $scope.notifications[id];
	};

	var reduce_count = function()
	{
		$scope.user.notification_count--;
	};

	var update_attendee_status = function(notifcation,status)
	{
		var event_id = notifcation.event_id;
		var user_id = notifcation.user_id;
		$scope.events[event_id].attendees[user_id] = status;
	};
}]);