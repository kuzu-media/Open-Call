/*global OpenCall */
/*jshint devel:true */

OpenCall.controller("Admin",['$scope','$rootScope','$location','angularFireAuth','angularFireCollectionExtended','FIREBASE_URL',function($scope,$rootScope,$location,angularFireAuth,angularFireCollectionExtended,FIREBASE_URL)
{

		angularFireCollectionExtended(FIREBASE_URL+"categories/top").then(function(categories)
		{
			$scope.categories = categories;

		});
		angularFireCollectionExtended(FIREBASE_URL+"categories/sub").then(function(subcategories)
		{
			$scope.subcategories = subcategories;
		});

		$scope.create_cat = function()
		{
			$scope.categories.add($scope.category);
			$scope.category = {};
		};

		$scope.create_subcat = function()
		{
			$scope.subcategories.add($scope.sub);
			$scope.sub.name = "";
		};

		$scope.delete = function(id)
		{
			$scope.subcategories.remove(id);
		};
}]);