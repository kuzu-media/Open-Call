/*global angular */
angular.module("firebase").factory("firebaseRefManager",["Firebase",function(Firebase)
{
	var refs = {};
	return function(url)
	{
		if(!refs[url])
		{
			// create the collection
			refs[url] = new Firebase(url);
		}

		// return the promise
		return refs[url];
	};
}]);

angular.module("firebase").factory("angularFireExtended",["firebaseRefManager",'angularFire',function(firebaseRefManager, angularFire)
{
	return function (url, scope, item)
	{
		var ref = firebaseRefManager(url);
		angularFire(ref, scope, item);


	};
}]);