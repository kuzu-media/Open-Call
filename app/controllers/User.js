/*global OpenCall */
/*jshint devel:true */

OpenCall.controller("User",['$scope','$rootScope','$location','angularFireAuth','angularFire','firebaseRefManager','FIREBASE_URL',function($scope,$rootScope,$location,angularFireAuth,angularFire,firebaseRefManager,FIREBASE_URL)
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
				$scope.users = {};
				angularFire(firebaseRefManager(FIREBASE_URL+"users"),$scope, 'users').then(function(){});

				$scope.users[user.id] = {
					first_name: $scope.new_user.first_name,
					last_name: $scope.new_user.last_name
				};

				console.log('$scope.users',$scope.users);


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
		$rootScope.logged_in = false;

	});

	$scope.$on("angularFireAuth:login", function() {

		angularFire(firebaseRefManager(FIREBASE_URL+"users").child($rootScope.user.id), $rootScope, 'user');
	});
}]);