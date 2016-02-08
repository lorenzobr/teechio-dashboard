teechioDashboard.controller('DashboardController', [
  '$scope',
  '$route',
  '$http',
  '$acache',
  function DashboardController($scope, $route, $http, $acache) {
    $scope.currentPage = $route.current.$$route.controller;
    $scope.applications = [];
    $scope.stats = {
      api: {
        calls: 0,
        percent: 0
      },
      events: {
        calls: 0,
        percent: 0
      },
      storage: {
        data: 0,
        percent: 0
      }
    };
    $scope.init = function () {
      $scope.loadApps();
      $scope.loadStats();
      //$scope.loadSettings();
      $scope.disabledWalkthrough = $acache.get('disabledWalkthrough');
    };
    $scope.disableWalkthrough = function () {
      $scope.disabledWalkthrough = true;
      $acache.put('disabledWalkthrough', true);
    };
    $scope.createApplication = function () {
      $http.post('/account/app', $scope._app).success(function (res) {
        $scope.applications.unshift(res);
        $scope.$emit('ux:form:clear', { form: '#new-application' });
      }).error(function (err) {
        var clazz = 'error';
        if (err.error == 'not_allowed_plan')
          clazz = 'warning';
        $scope.$emit('nprogress:loading', { state: 'done' });
        $scope.$emit('ux:notification', {
          container: '#new-application',
          clazz: clazz,
          msg: err.message
        });
      });
    };
    $scope.loadApps = function () {
      $http.get('/account/apps').success(function (res, status) {
        angular.forEach(res, function (value, index) {
          $scope.applications.push(value);
        });
      }).error(function (err, status) {
      });
    };
    $scope.loadStats = function () {
      $http.get('/account/stats/apps').success(function (res, status) {
        $scope.stats.api.calls = res.api;
        $scope.stats.events.calls = res.push;
        $('p.loader', '.api-calls').fadeOut('slow', function () {
          $('span.stats', '.api-calls').fadeIn('slow');
        });
      }).error(function (err, status) {
      });
      $http.get('/account/stats/storage').success(function (res, status) {
        $scope.stats.storage.data = Math.round(res.container_size);
        $('p.loader', '.storage-usage').fadeOut('slow', function () {
          $('span.stats', '.storage-usage').fadeIn('slow');
        });
      }).error(function (err, status) {
      });
    };
    $scope.loadSettings = function () {
      $http.get('/api/account/settings').success(function (res, status) {
        $acache.put('_usettings', res);
        //var currentPlan = res.settings.subscription.plan.toLowerCase();
        //var quotas = res.plans[currentPlan];
        var quotas = {
            calls: 50000,
            storage: 1024
          };
        $scope.stats.api.percent = ($scope.stats.api.calls / quotas.calls * 100).toFixed(1);
        $scope.stats.storage.percent = ($scope.stats.storage.data / quotas.storage * 100).toFixed(1);
      });
    };
    $scope.init();
  }
]);