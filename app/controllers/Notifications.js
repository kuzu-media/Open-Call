/* global OpenCall */
/*jshint devel:true */

OpenCall.controller("Notifications",['FIREBASE_URL','$rootScope','angularFire','firebaseRefManager','$scope',function(FIREBASE_URL,$rootScope,angularFire,firebaseRefManger,$scope)
{
	angularFire(firebaseRefManger(FIREBASE_URL+"notifications").child($rootScope.user_login.id),$scope,'notifcations').then(function()
	{
		$scope.events = {};
		for (var not in $scope.notifcations) {

			if($scope.notifcations[not].type === 1)
			{

				var event_id = $scope.notifcations[not].event_id;
				var user_id = $scope.notifcations[not].user_id;

				$scope.events[event_id] = {};
				angularFire(firebaseRefManger(FIREBASE_URL+"events").child(event_id),$scope,'events',event_id);
				angularFire(firebaseRefManger(FIREBASE_URL+"users").child(user_id),$scope,'users',user_id);
			}
		}

		$scope.log_scope = function()
		{
			console.log('$scope.users',$scope.users);
		};
	});
}]);