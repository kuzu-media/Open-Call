/*global OpenCall */
OpenCall.config(function($routeProvider)
{
	$routeProvider
	.when("/",{
		templateUrl: 'app/views/events.html',
		controller: "Events",
		authRequired: true,
		title: 'Events'
	})
	.when("/events/:event_id",{
		templateUrl: 'app/views/event.html',
		controller: "Events",
		authRequired: true,
		title: ''
	})
	.when("/welcome",{
		templateUrl: 'app/views/welcome.html',
		controller: "User",
		authRequired: false,
		title: 'Welcome'
	})
	.when("/join",{
		templateUrl: 'app/views/join.html',
		controller: "User",
		authRequired: false,
		title: 'Join'
	})
	.when("/login",{
		templateUrl: 'app/views/login.html',
		controller: "User",
		authRequired: false,
		title: 'Login'
	}).when("/create",{
		templateUrl: 'app/views/create.html',
		controller: "Events",
		authRequired: true,
		title: 'Create an Event'
	}).
	when("/admin",{
		templateUrl:'app/views/admin.html',
		controller: 'Admin',
		authRequired: true,
		title: 'Admin'
	});
});