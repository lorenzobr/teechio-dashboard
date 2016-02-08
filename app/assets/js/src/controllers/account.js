teechioDashboard.controller('AccountController', [ '$scope', '$http', function AccountController($scope, $http) {
	
	$scope.register = function() {
		$scope.$emit('nprogress:loading', { state: 'start' });
		$http.post('/api/account/register', $scope.account)
		.success(function(res, status) {
			location.href = "/walkthrough";
		})
		.error(function(err, status) {
			$scope.$emit('nprogress:loading', { state: 'done' });
			$scope.$emit('ux:notification', { container: '.login-container', clazz: 'error', msg: err.message });
		});
	};

	$scope.auth = function() {
		$scope.$emit('nprogress:loading', { state: 'start' });
		$http.post('/auth', $scope.account)
		.success(function(res, status) {
			location.href = '/';
		})
		.error(function(err, status) {
			$scope.$emit('nprogress:loading', { state: 'done' });
			$scope.$emit('ux:notification', { container: '.login-container', clazz: 'error', msg: err.message });
		});
	};

	$scope.sendReset = function() {
		$scope.$emit('nprogress:loading', { state: 'start' });
		$http.get('/api/account/forgot?email=' + $scope._forgot.email)
		.success(function(res, status) {
			$scope.$emit('nprogress:loading', { state: 'done' });
			$scope.$emit('ux:notification', { container: '#password-recovery', clazz: 'success', msg: 'You\'ve got mail! We sent you an email with instructions on how to reset your password.' });
		})
		.error(function(err, status) {
			$scope.$emit('nprogress:loading', { state: 'done' });
			$scope.$emit('ux:notification', { container: '#password-recovery', clazz: 'error', msg: err.message });
		});
	};

	$scope.doReset = function() {
		$scope.$emit('nprogress:loading', { state: 'start' });
		$http.post('/api/account/doreset', $scope._forgot)
		.success(function(res, status) {
			location.href = '/';
		})
		.error(function(err, status) {
			$scope.$emit('nprogress:loading', { state: 'done' });
			$scope.$emit('ux:notification', { container: '.resetpwd-container', clazz: 'error', msg: err.message });
		});
	};	
}]);