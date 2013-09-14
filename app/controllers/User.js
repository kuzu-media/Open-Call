/*global OpenCall */
/*jshint devel:true */

OpenCall.controller("User",['$scope','$rootScope','$location','angularFireAuth','angularFireCollectionExtended','FIREBASE_URL',function($scope,$rootScope,$location,angularFireAuth,angularFireCollectionExtended,FIREBASE_URL)
{
	$scope.login = function()
	{
		// pass the user
		angularFireAuth.login("password",$scope.user).then(function()
		{
			$location.path("/");
		});
	};

	$scope.logout = function()
	{
		angularFireAuth.logout();

	};

	$scope.create_user = function()
	{
		// create the user
		angularFireAuth.createUser($scope.new_user.email,$scope.new_user.password,function(err,user){
			if(user)
			{
				angularFireCollectionExtended(FIREBASE_URL+"users").then(function(users)
				{
					users.add({
						id: user.id,
						first_name: $scope.new_user.first_name,
						last_name: $scope.new_user.last_name
					});

				});


				$location.path("/");
			}
		});
	};

	// validate that the password and confirm password match
	$scope.validatePassword = function()
	{
		// set the not matching error if the passwords don't match
		$scope.join_form.confirm.$error.notMatching = $scope.new_user.password !== $scope.new_user.confirm;
	};

	$scope.$on("angularFireAuth:error", function(evt, err) {
		console.log('err',err);
	});

	$scope.$on("angularFireAuth:logout", function() {
		$scope.name = null;
		$location.path("/welcome");

	});

	$scope.$on("angularFireAuth:login", function() {
		angularFireCollectionExtended(FIREBASE_URL+"users").then(function(users)
		{
			$scope.name = users.getByKey('id',$rootScope.user.id).first_name;
		});
	});
}]);