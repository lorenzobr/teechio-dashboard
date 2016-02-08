teechioDashboard.directive('setConsoleMethod', function() {
	return function(scope, element, attr) 
	{
		element.click(function() {
			if(attr.setConsoleMethod == 'post') {
				scope.typedEndpoint = scope.console.endpoint + scope.console.path;
			}
			scope.$apply();
		});
	}
});

teechioDashboard.directive('consoleEndpointHint', function() {
	return function(scope, element, attr) 
	{
		var endpoints = [
			'classes',
			'users',
			'modules',
			'materials',
			'enrollments',
			'assessments',
			'assignments',
			'submissions',
			'files'
		];
		element.autocomplete({
			source: endpoints,
			select: function(event, ui) {
				scope.hintDoc = (ui.item.value == 'classes') ? 'objects' : ui.item.value;
				scope.console.path = ui.item.value;
				$('.hint-box').slideDown();
			},
			close: function() {
				scope.$apply(function() {
					scope.buildEndpoint();
				});
			}
		});

		element.focusin(function() {
			$('.hint-box').slideUp();
		})
	}
});

teechioDashboard.directive('animateConsole', function() {
	return function(scope, element, attr) 
	{
		scope.$on('animate:console', function(event, message) {
			var _console = angular.element('#api-output');

			if(!(_console.is(':visible'))) _console.slideDown('fast');
			_console.children('pre').fadeOut('fast', function() 
			{
				_console.children('pre').fadeIn('fast');
				if(message.error) { _console.addClass('error') } else _console.removeClass('error');
			});
			
			if(!message.error) {
				angular.element('html, body').animate({
					scrollTop: _console.offset().top
				}, 800);
			}
		});
	}
});