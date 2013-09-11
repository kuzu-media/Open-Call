/*global OpenCall */
OpenCall.config(function($routeProvider)
{
	$routeProvider
	.when("/",{
		templateUrl: 'app/views/events.html',
		controller: "Events",
		authRequired: true
	})
	.when("/welcome",{
		templateUrl: 'app/views/welcome.html',
		controller: "User",
		authRequired: false
	})
	.when("/join",{
		templateUrl: 'app/views/join.html',
		controller: "User",
		authRequired: false
	})
	.when("/login",{
		templateUrl: 'app/views/login.html',
		controller: "User",
		authRequired: false
	});
});