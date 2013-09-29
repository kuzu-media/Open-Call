/*jshint devel:true */
/*global angular */

var OpenCall = angular.module("OpenCall", ["firebase","ui.bootstrap"]);

OpenCall.run(['angularFireAuth',"FIREBASE_URL","firebaseRefManager","$rootScope",'$route',function(angularFireAuth,FIREBASE_URL,firebaseRefManager,$rootScope, $route)
{
	var firbase_ref = firebaseRefManager(FIREBASE_URL);
	angularFireAuth.initialize(firbase_ref,{'scope': $rootScope,'name':'user','path':'/welcome'});

	$rootScope.page_title = 'Welcome';
	$rootScope.$on('$routeChangeSuccess', function() {
		$rootScope.page_title = $route.current.title;
	});
}]);

OpenCall.constant("FIREBASE_URL","https://opencall.firebaseio.com/");


OpenCall.directive('ngBlur', function() {
  return function( scope, elem, attrs ) {
    elem.bind('blur', function() {
      scope.$apply(attrs.ngBlur);
    });
  };
});

OpenCall.filter('toArray', function () {
    'use strict';

    return function (obj) {
        if (!(obj instanceof Object)) {
            return obj;
        }

        return Object.keys(obj).map(function (key) {
            return Object.defineProperty(obj[key], '$key', {__proto__: null, value: key});
        });
    };
});