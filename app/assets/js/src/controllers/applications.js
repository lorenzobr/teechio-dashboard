teechioDashboard.controller('ApplicationsController', [ '$scope', '$route', '$routeParams', '$http', '$acache', function ApplicationsController($scope, $route, $routeParams, $http, $acache) {
	$scope.currentPage = $route.current.$$route.controller;

	$scope.dashboard = {
		apikey: _ukey,
		appid: $routeParams.id,
		appname: '',
		apicalls: 0,
		created: ''
	};

	$scope.console = {
		path: '',
		key: '',
		method: 'GET',
		endpoint: 'http://api.teech.io/',
		payload: '',
		query: ''
	};

	$scope.apihost = 'http://api.teech.io/';

	$scope.init = function() {
		$scope.loadStorage();

		$http.get('/account/app/' + $routeParams.id)
		.success(function(res, status) {
			$scope.dashboard.appname = res.name;
			$scope.dashboard.created = res.created;
		})
		.error(function(err, status) {});

		var _usettings = $acache.get('_usettings');
		//$scope.currentPlan = _usettings.settings.subscription.plan;
		
		$scope.typed = { endpoint: 'http://api.teech.io/' }
	};

	$scope.deleteApp = function(uid) {
		if($scope.dashboard.appname === $scope._deleteApp['name']) {
			$http.delete('/account/app/' + uid)
			.success(function(res, status) {
				location.href = '/';
			})
			.error(function(err, status) {});
		} else {
			$scope.$emit('ux:notification', { container: '#delete-modal', clazz: 'error', msg: 'Ooops! This is not the name of your app.' });
		}
	};

	$scope.switchTab = function(section) {
		$scope.sectionTab = section;
		//reset the console
		$scope.console = {
			path: '',
			key: '',
			method: 'GET',
			endpoint: 'http://api.teech.io/',
			payload: '',
			query: ''
		};
		$scope.typed.endpoint = $scope.console.endpoint;
	};

	$scope.buildEndpoint = function() {
		$scope.typed.endpoint = $scope.console.endpoint + ($scope.console.path || '') + '/' + ($scope.console.key || '');
		$scope.typedPath = ($scope.console.path || '') + '/' + ($scope.console.key || '') 

		if($scope.sectionTab == 'search') {
			$scope.typed.endpoint = $scope.console.endpoint + ($scope.console.path || '') + '?query=' + ($scope.console.query || '');
			$scope.typedPath = $scope.console.path + '?query=' + ($scope.console.query || '');
		}
	};

	$scope.switchMethod = function(method) {
		$scope.console.method = method;
	};

	$scope.makeCall = function() {
		$scope.$emit('nprogress:loading', { state: 'start' });

		var u = $scope.typedPath;
		if(u.charAt(u.length-1) == '/')
			$scope.typedPath = u.substring(0, u.length-1);

		var h = {
			method: $scope.console.method,
			url: '/console/call/?path=' + encodeURIComponent($scope.typedPath),
			headers: {
				"Teech-REST-API-Key": $scope.dashboard.apikey,
				"Teech-Application-Id": $scope.dashboard.appid
			}
		};
		
		if((h.method == 'POST' || h.method == 'PUT')) {
			h['Content-Type'] = 'application/json';
			h['data'] = $scope.console.payload;
		}	
		$http(h)
		.success(function(res, status, headers) {
			renderOutput(null, res);
		})
		.error(function(err, status, headers) {
			renderOutput(true, err);
		});

		function renderOutput(error, res) {
			var message = (error) ? { error: true } : true;
			$scope.$emit('nprogress:loading', { state: 'done' });
			$scope.$emit('animate:console', message);
			$scope.output = {
				status: res.headers.status,
				length: res.headers['Content-Length'],
				type: res.headers['Content-Type'],
				date: res.headers.date,
				body: JSON.stringify(res.body, undefined, 2)
			};
		}
	};

	$scope.loadWeeklyChart = function() {
		var svg = dimple.newSvg("#app-usage-chart", "100%", "100%");
		d3.json('/account/stats/app/' + $routeParams.id).get(function(error, res) {
			if (error) return console.warn(error);
			var weeklyCalls = [],
				cursor = 7,
				aggr = 0,
				ind = 0;
				week = 1;
			angular.forEach(res.apis, function(value, index) {
				ind ++;
				if(cursor == 0) {
					weeklyCalls.push({
						week:  'Week ' + week,
						calls: aggr 
					});
					$scope.dashboard.apicalls += aggr;
					$scope.$apply();
					week ++;
					cursor = 7;
					aggr = 0;
				}
				aggr = aggr + value;
				cursor --;
				if(_.size(res.apis) == ind) {
					var chart = new dimple.chart(svg, weeklyCalls);
					chart.setBounds(30, 15, "90%", "90%");
			      	var xAxis = chart.addCategoryAxis('x', 'week');
			      	var yAxis = chart.addMeasureAxis('y', 'calls');
			      	chart.addColorAxis('calls', '#7E438D');
			      	chart.addColorAxis('week', '#1fbba6');
			      	var s = chart.addSeries(null, dimple.plot.line);
			      	chart.draw();
			      	yAxis.titleShape.remove();
			      	xAxis.titleShape.remove();
				}
			});
		});
	};

	$scope.loadStorage = function() {
		var h = {
			method: 'GET',
			url: '/console/call/?path=files',
			headers: {
				"Teech-REST-API-Key": $scope.dashboard.apikey,
				"Teech-Application-Id": $scope.dashboard.appid
			}
		};
		$http(h)
		.success(function(res, status) {
			$scope.files = res.body
		});
	};

	$scope.deleteFile = function(id, name) {
		var h = {
			method: 'DELETE',
			url: '/console/call/?path=files/' + name,
			headers: {
				"Teech-REST-API-Key": $scope.dashboard.apikey,
				"Teech-Application-Id": $scope.dashboard.appid
			}
		};
		$http(h)
		.success(function(res, status) {
			$scope.$emit('faden:remove', { el: 'tr#' + id, container: '#files-list' });
		});
	};

	$scope.init();
	
}]);