/*global OpenCall */
/*jshint devel:true */

OpenCall.controller("Admin",['$scope','$rootScope','$location','angularFireAuth','angularFire','firebaseRefManager','FIREBASE_URL',function($scope,$rootScope,$location,angularFireAuth,angularFire,firebaseRefManager,FIREBASE_URL)
{
		$scope.categories = {};
		$scope.subcategories = {};

		var cat_ref = firebaseRefManager(FIREBASE_URL+"categories/top");
		var sub_ref = firebaseRefManager(FIREBASE_URL+"categories/sub");

		angularFire(cat_ref, $scope,'categories');
		angularFire(sub_ref, $scope,'subcategories');

		$scope.create_cat = function()
		{
			$scope.categories[cat_ref.push().name()] = $scope.category;
			$scope.category = {};
		};

		$scope.create_subcat = function()
		{
			console.log('$scope.categories',$scope.categories);
			$scope.subcategories[sub_ref.push().name()] = angular.copy($scope.sub);
			$scope.sub.name = "";

		};

		$scope.delete = function(id)
		{
			console.log('id',id, $scope.subcategories);
			$scope.subcategories[id] = null;
		};
}]);