/*jshint devel:true */
/*global angular */

var OpenCall = angular.module("OpenCall", ["firebase"]);

OpenCall.run(['angularFireAuth',"FIREBASE_URL","firebaseRefManager","$rootScope",function(angularFireAuth,FIREBASE_URL,firebaseRefManager,$rootScope)
{
	var firbase_ref = firebaseRefManager(FIREBASE_URL);
	angularFireAuth.initialize(firbase_ref,{'scope': $rootScope,'name':'user','path':'/welcome'});
}]);

OpenCall.constant("FIREBASE_URL","https://opencall.firebaseio.com/");


OpenCall.directive('ngBlur', function() {
  return function( scope, elem, attrs ) {
    elem.bind('blur', function() {
      scope.$apply(attrs.ngBlur);
    });
  };
});