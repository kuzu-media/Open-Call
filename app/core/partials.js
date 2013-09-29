/*global OpenCall*/
OpenCall.directive("navbar",function()
{
	return {
		restrict: "E",
		replace: 'true',
		templateUrl: "app/views/partials/navbar.html"
	};
});

OpenCall.directive('backButton', function(){
	return {
		restrict: 'A',

		link: function(scope, element) {

			element.bind('click', function () {
				history.back();
				scope.$apply();
			});


		}
	};
});
