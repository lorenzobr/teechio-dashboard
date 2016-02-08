(function(window, document, undefined) {
	'use strict';

	var teechioDashboard = angular.module('teechioDashboard', ['ngRoute']);

	var themepath = '/public/';

	teechioDashboard.config(
		function($interpolateProvider) { 
			$interpolateProvider.startSymbol('{[').endSymbol(']}') 
		}
	);
	
	teechioDashboard.config(
		function($routeProvider, $locationProvider) { 
			$routeProvider
				.when('/', {
					templateUrl: themepath + 'partials/home.html',
					controller: 'DashboardController'
				})
				.when('/walkthrough', {
					templateUrl: themepath + 'partials/walkthrough.html',
					controller: 'WalkthroughController'
				})
				.when('/apps/:id', {
					templateUrl: themepath + 'partials/applications.html',
					controller: 'ApplicationsController'
				})
				.when('/settings', {
					templateUrl: themepath + 'partials/settings.html',
					controller: 'SettingsController'
				});

			$locationProvider
				.html5Mode(true);
		}
	);
	
	teechioDashboard.factory('$acache', [ '$cacheFactory', function($cacheFactory) {
		return {
			get: function(key) {
				var cache = localStorage.getItem(key);
				try {
					cache = JSON.parse(localStorage.getItem(key));
					return cache;
				}
				catch(err) { return cache }
			},
			put: function(key, value) {
				(typeof value === 'string') 
				? localStorage.setItem(key, value) : localStorage.setItem(key, JSON.stringify(value));
			},
			remove: function(key) {
				localStorage.removeItem(key);
			}
		}
	}]);
	
	window.teechioDashboard = teechioDashboard;
})(window, document);
teechioDashboard.controller('AccountController', [
  '$scope',
  '$http',
  function AccountController($scope, $http) {
    $scope.register = function () {
      $scope.$emit('nprogress:loading', { state: 'start' });
      $http.post('/api/account/register', $scope.account).success(function (res, status) {
        location.href = '/walkthrough';
      }).error(function (err, status) {
        $scope.$emit('nprogress:loading', { state: 'done' });
        $scope.$emit('ux:notification', {
          container: '.login-container',
          clazz: 'error',
          msg: err.message
        });
      });
    };
    $scope.auth = function () {
      $scope.$emit('nprogress:loading', { state: 'start' });
      $http.post('/auth', $scope.account).success(function (res, status) {
        location.href = '/';
      }).error(function (err, status) {
        $scope.$emit('nprogress:loading', { state: 'done' });
        $scope.$emit('ux:notification', {
          container: '.login-container',
          clazz: 'error',
          msg: err.message
        });
      });
    };
    $scope.sendReset = function () {
      $scope.$emit('nprogress:loading', { state: 'start' });
      $http.get('/api/account/forgot?email=' + $scope._forgot.email).success(function (res, status) {
        $scope.$emit('nprogress:loading', { state: 'done' });
        $scope.$emit('ux:notification', {
          container: '#password-recovery',
          clazz: 'success',
          msg: 'You\'ve got mail! We sent you an email with instructions on how to reset your password.'
        });
      }).error(function (err, status) {
        $scope.$emit('nprogress:loading', { state: 'done' });
        $scope.$emit('ux:notification', {
          container: '#password-recovery',
          clazz: 'error',
          msg: err.message
        });
      });
    };
    $scope.doReset = function () {
      $scope.$emit('nprogress:loading', { state: 'start' });
      $http.post('/api/account/doreset', $scope._forgot).success(function (res, status) {
        location.href = '/';
      }).error(function (err, status) {
        $scope.$emit('nprogress:loading', { state: 'done' });
        $scope.$emit('ux:notification', {
          container: '.resetpwd-container',
          clazz: 'error',
          msg: err.message
        });
      });
    };
  }
]);
teechioDashboard.controller('ApplicationsController', [
  '$scope',
  '$route',
  '$routeParams',
  '$http',
  '$acache',
  function ApplicationsController($scope, $route, $routeParams, $http, $acache) {
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
    $scope.init = function () {
      $scope.loadStorage();
      $http.get('/account/app/' + $routeParams.id).success(function (res, status) {
        $scope.dashboard.appname = res.name;
        $scope.dashboard.created = res.created;
      }).error(function (err, status) {
      });
      var _usettings = $acache.get('_usettings');
      //$scope.currentPlan = _usettings.settings.subscription.plan;
      $scope.typed = { endpoint: 'http://api.teech.io/' };
    };
    $scope.deleteApp = function (uid) {
      if ($scope.dashboard.appname === $scope._deleteApp['name']) {
        $http.delete('/account/app/' + uid).success(function (res, status) {
          location.href = '/';
        }).error(function (err, status) {
        });
      } else {
        $scope.$emit('ux:notification', {
          container: '#delete-modal',
          clazz: 'error',
          msg: 'Ooops! This is not the name of your app.'
        });
      }
    };
    $scope.switchTab = function (section) {
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
    $scope.buildEndpoint = function () {
      $scope.typed.endpoint = $scope.console.endpoint + ($scope.console.path || '') + '/' + ($scope.console.key || '');
      $scope.typedPath = ($scope.console.path || '') + '/' + ($scope.console.key || '');
      if ($scope.sectionTab == 'search') {
        $scope.typed.endpoint = $scope.console.endpoint + ($scope.console.path || '') + '?query=' + ($scope.console.query || '');
        $scope.typedPath = $scope.console.path + '?query=' + ($scope.console.query || '');
      }
    };
    $scope.switchMethod = function (method) {
      $scope.console.method = method;
    };
    $scope.makeCall = function () {
      $scope.$emit('nprogress:loading', { state: 'start' });
      var u = $scope.typedPath;
      if (u.charAt(u.length - 1) == '/')
        $scope.typedPath = u.substring(0, u.length - 1);
      var h = {
          method: $scope.console.method,
          url: '/console/call/?path=' + encodeURIComponent($scope.typedPath),
          headers: {
            'Teech-REST-API-Key': $scope.dashboard.apikey,
            'Teech-Application-Id': $scope.dashboard.appid
          }
        };
      if (h.method == 'POST' || h.method == 'PUT') {
        h['Content-Type'] = 'application/json';
        h['data'] = $scope.console.payload;
      }
      $http(h).success(function (res, status, headers) {
        renderOutput(null, res);
      }).error(function (err, status, headers) {
        renderOutput(true, err);
      });
      function renderOutput(error, res) {
        var message = error ? { error: true } : true;
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
    $scope.loadWeeklyChart = function () {
      var svg = dimple.newSvg('#app-usage-chart', '100%', '100%');
      d3.json('/account/stats/app/' + $routeParams.id).get(function (error, res) {
        if (error)
          return console.warn(error);
        var weeklyCalls = [], cursor = 7, aggr = 0, ind = 0;
        week = 1;
        angular.forEach(res.apis, function (value, index) {
          ind++;
          if (cursor == 0) {
            weeklyCalls.push({
              week: 'Week ' + week,
              calls: aggr
            });
            $scope.dashboard.apicalls += aggr;
            $scope.$apply();
            week++;
            cursor = 7;
            aggr = 0;
          }
          aggr = aggr + value;
          cursor--;
          if (_.size(res.apis) == ind) {
            var chart = new dimple.chart(svg, weeklyCalls);
            chart.setBounds(30, 15, '90%', '90%');
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
    $scope.loadStorage = function () {
      var h = {
          method: 'GET',
          url: '/console/call/?path=files',
          headers: {
            'Teech-REST-API-Key': $scope.dashboard.apikey,
            'Teech-Application-Id': $scope.dashboard.appid
          }
        };
      $http(h).success(function (res, status) {
        $scope.files = res.body;
      });
    };
    $scope.deleteFile = function (id, name) {
      var h = {
          method: 'DELETE',
          url: '/console/call/?path=files/' + name,
          headers: {
            'Teech-REST-API-Key': $scope.dashboard.apikey,
            'Teech-Application-Id': $scope.dashboard.appid
          }
        };
      $http(h).success(function (res, status) {
        $scope.$emit('faden:remove', {
          el: 'tr#' + id,
          container: '#files-list'
        });
      });
    };
    $scope.init();
  }
]);
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
teechioDashboard.controller('SettingsController', [
  '$scope',
  '$route',
  '$http',
  '$acache',
  function SettingsController($scope, $route, $http, $acache) {
    $scope.currentPage = $route.current.$$route.controller;
    $scope.settings = {};
    $scope.plans = {};
    $scope.init = function () {
      $scope.loadSettings();
    };
    $scope.loadSettings = function () {
      $scope.$emit('nprogress:loading', { state: 'start' });
      $http.get('/api/account/settings').success(function (res, status) {
        $scope.$emit('nprogress:loading', { state: 'done' });
        $scope.settings = res.settings;
        $scope.plans = res.plans;
        $scope._profile = {
          firstname: res.settings.firstname,
          lastname: res.settings.lastname
        };
      }).error(function (err, status) {
        $scope.$emit('nprogress:loading', { state: 'done' });
        $scope.$emit('ux:notification', {
          container: 'div#service-notification',
          clazz: 'warning',
          msg: 'We were unable to retrieve your settings. Something went wrong with our servers.',
          timeout: 15000
        });
      });
    };
    $scope.updateFullname = function () {
      $http.put('/api/account/fullname', $scope._profile).success(function (res, status) {
        $scope.$emit('ux:notification', {
          container: 'form.profile-settings',
          clazz: 'success',
          msg: res.message
        });
      }).error(function (err, status) {
      });
    };
    $scope.updatePassword = function () {
      $http.put('/api/account/changepwd', $scope._password).success(function (res, status) {
        $scope.$emit('ux:notification', {
          container: 'form.change-password',
          clazz: 'success',
          msg: res.message
        });
      }).error(function (err, status) {
        $scope.$emit('ux:notification', {
          container: 'form.change-password',
          clazz: 'error',
          msg: err.message
        });
      });
    };
    $scope.saveCCard = function () {
      $scope.$emit('nprogress:loading', { state: 'start' });
      var card = $scope._ccard;
      var exp_month = card.exp.substr(0, 2), exp_year = card.exp.substr(3, card.exp.length);
      var last4 = card.number.substr(card.number.length - 4, card.number.length);
      Stripe.setPublishableKey('pk_test_6nU4oYjqeP30ZjrPOcEltmT2');
      Stripe.card.createToken({
        number: card.number,
        cvc: card.cvc,
        exp_month: exp_month,
        exp_year: exp_year
      }, stripeResponseHandler);
      function stripeResponseHandler(status, card) {
        if (!card.error) {
          $http.post('/billing/customers/' + $scope.settings.subscription.cusid + '/cards', { token: card.id }).success(function (res) {
            $scope.settings.card.last4 = last4;
            $scope.settings.default_card = card.id;
            $scope.$emit('ux:form:clear', { form: 'form.ccard-new' });
            $scope.$emit('toggle:slide', {
              el: '#ccard-selection',
              pos: 'up'
            });
            $scope.$emit('nprogress:loading', { state: 'done' });
          }).error(function (err) {
            $scope.$emit('nprogress:loading', { state: 'done' });
            $scope.$emit('ux:notification', {
              container: '#ccard-selection',
              clazz: 'error',
              msg: err.error.message
            });
          });
        } else {
          $scope.$emit('nprogress:loading', { state: 'done' });
          $scope.$emit('ux:notification', {
            container: '#ccard-selection',
            clazz: 'error',
            msg: err.error.message
          });
        }
      }
    };
    $scope.changePlan = function (plan, plan_id) {
      $scope.$emit('nprogress:loading', { state: 'start' });
      $http.post('/billing/customers/' + $scope.settings.subscription.cusid + '/subscriptions', {
        subscription: $scope.settings.subscription.id,
        plan: plan_id
      }).success(function (res) {
        $scope.settings.subscription.plan = plan;
        $scope.$emit('nprogress:loading', { state: 'done' });
      }).error(function (err) {
        $scope.$emit('ux:notification', {
          container: '.change-plan',
          clazz: 'warning',
          msg: err.error.error.message || err.error.message
        });
        $scope.$emit('nprogress:loading', { state: 'done' });
      });
    };
    $scope.init();
  }
]);
teechioDashboard.controller('WalkthroughController', [
  '$scope',
  '$route',
  function WalkthroughController($scope, $route) {
    $scope.currentPage = $route.current.$$route.controller;
  }
]);
teechioDashboard.directive('setConsoleMethod', function () {
  return function (scope, element, attr) {
    element.click(function () {
      if (attr.setConsoleMethod == 'post') {
        scope.typedEndpoint = scope.console.endpoint + scope.console.path;
      }
      scope.$apply();
    });
  };
});
teechioDashboard.directive('consoleEndpointHint', function () {
  return function (scope, element, attr) {
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
      select: function (event, ui) {
        scope.hintDoc = ui.item.value == 'classes' ? 'objects' : ui.item.value;
        scope.console.path = ui.item.value;
        $('.hint-box').slideDown();
      },
      close: function () {
        scope.$apply(function () {
          scope.buildEndpoint();
        });
      }
    });
    element.focusin(function () {
      $('.hint-box').slideUp();
    });
  };
});
teechioDashboard.directive('animateConsole', function () {
  return function (scope, element, attr) {
    scope.$on('animate:console', function (event, message) {
      var _console = angular.element('#api-output');
      if (!_console.is(':visible'))
        _console.slideDown('fast');
      _console.children('pre').fadeOut('fast', function () {
        _console.children('pre').fadeIn('fast');
        if (message.error) {
          _console.addClass('error');
        } else
          _console.removeClass('error');
      });
      if (!message.error) {
        angular.element('html, body').animate({ scrollTop: _console.offset().top }, 800);
      }
    });
  };
});
teechioDashboard.directive('bodyId', function () {
  return {
    restrict: 'A',
    link: function (scope, element, attr) {
      scope.$watch('currentPage', function (value) {
        if ('DashboardController' == value) {
          $('body').attr('id', 'dashboard-page');
        }
        if ('WalkthroughController' == value) {
          $('body').attr('id', 'walkthrough-page');
        }
        if ('ApplicationsController' == value) {
          $('body').attr('id', 'applications-page');
        }
        if ('SettingsController' == value) {
          $('body').attr('id', 'settings-page');
        }
      });
    }
  };
});
teechioDashboard.directive('walkthrough', function () {
  return function (scope, element, attr) {
    $('.next-step-btn', element).click(function () {
      var nextStep = $(this).data('href');
      var currentStep = $(this).parents('.step');
      currentStep.fadeOut('fast', function () {
        $('div' + nextStep, element).fadeIn();
      });
      $('i', '.walkthrough-index').removeClass('active');
      $('i' + nextStep, '.walkthrough-index').addClass('active');
    });
  };
});
teechioDashboard.directive('notificationPop', function () {
  return function (scope, element, attrs) {
    scope.$on('ux:notification', function (event, message) {
      var $notification = $('.notification', message.container);
      var speed = message.speed ? message.speed : 'fast';
      var timeout = message.timeout ? message.timeout : 5000;
      $notification.removeClass('success error warning').addClass(message.clazz).html(message.msg).slideDown(speed, function () {
        setTimeout(function () {
          $notification.slideUp();
        }, timeout);
      });
    });
  };
});
teechioDashboard.directive('nProgress', function () {
  return function (scope, element, attrs) {
    scope.$on('nprogress:loading', function (event, message) {
      switch (message.state) {
      case 'start':
        NProgress.start();
        break;
      case 'done':
        NProgress.done();
        break;
      }
    });
  };
});
teechioDashboard.directive('selectOnFocus', function () {
  return function (scope, element, attr) {
    element.focus(function () {
      $(this).select();
    });
    element.mouseup(function (e) {
      e.preventDefault();
    });
  };
});
teechioDashboard.directive('fadeNRemove', function () {
  return function (scope, element, attrs) {
    scope.$on('faden:remove', function (event, message) {
      var speed = message.speed ? message.speed : 'fast';
      $(message.container).find(message.el).fadeOut(speed, function () {
        $(this).remove();
      });
    });
  };
});
teechioDashboard.directive('showOrHide', function () {
  return {
    restrict: 'A',
    link: function (scope, element, attr) {
      element.click(function (e) {
        $(attr.showOrHide).slideToggle('fast', function () {
        });
      });
    }
  };
});
teechioDashboard.directive('activeHighlight', function () {
  return {
    restrict: 'A',
    link: function (scope, element, attr) {
      $('a', element).click(function (e) {
        $('a.active', element).removeClass('active');
        $(this).addClass('active');
      });
    }
  };
});
teechioDashboard.directive('slideToggle', function () {
  return function (scope, element, attr) {
    scope.$on('toggle:slide', function (event, message) {
      var speed = message.speed ? message.speed : 'fast';
      if (message.pos == 'up')
        $(message.el).slideUp(speed, function () {
        });
      else
        $(message.el).slideDown(speed, function () {
        });
    });
  };
});
teechioDashboard.directive('clearForm', function () {
  return function (scope, element, attrs) {
    scope.$on('ux:form:clear', function (event, message) {
      $('input, textarea', message.form).not(':button, :submit').val('').removeAttr('checked').removeAttr('selected');
      $('.modal').modal('hide');
    });
  };
});
teechioDashboard.directive('fileUploader', function () {
  return {
    restrict: 'A',
    link: function (scope, element, attr) {
      scope._queue = [];
      scope._queueSize = 0;
      scope._uprogress = false;
      var opts = {
          runtimes: 'html5',
          browse_button: attr.id,
          multipart: false,
          drop_element: 'drop-area',
          max_file_size: '64mb',
          url: '/console/upload',
          headers: {
            'Teech-REST-API-key': scope.dashboard.apikey,
            'Teech-Application-Id': scope.dashboard.appid
          }
        };
      var uploader = new plupload.Uploader(opts);
      uploader.bind('Init', function (up, params) {
      });
      uploader.init();
      uploader.bind('FilesAdded', function (up, files) {
        angular.forEach(files, function (file) {
          var file_copy = {
              id: file.id,
              name: file.name,
              size: plupload.formatSize(file.size),
              synced: 'not-synced'
            };
          scope.$apply(function () {
            scope._queue.push(file);
            scope._queueSize += 1;
            if (scope.files)
              scope.files.unshift(file_copy);
          });
        });
      });
      uploader.bind('BeforeUpload', function (uploader, file) {
      });
      uploader.bind('UploadProgress', function (up, file) {
        scope.$apply(function () {
          scope._uprogress = true;
        });
        $('span.percentage', '#uploader-progress').html(file.percent);
      });
      uploader.bind('FileUploaded', function (up, file, res) {
        if (res) {
          $('#upload-modal').modal('hide');
          $('span.percentage', '#uploader-progress').html(0);
          scope.$apply(function () {
            scope.files.shift();
            // removes the file in queue and now fully uploaded
            scope.files.unshift(JSON.parse(res.response));
            scope._queue = [];
            scope._queueSize = 0;
            scope._uprogress = false;
          });
        }
        up.refresh();
      });
      uploader.bind('Error', function (up, err) {
        $('.notification', '#uploader-progress').addClass('error').html(err.message).slideDown('fast');
        up.refresh();
      });
      scope.startUpload = function () {
        uploader.start();
      };
      scope.removeFile = function (index, file) {
        uploader.removeFile(file.gfile);
        scope.files.splice(index, 1);
      };
      $('#upload-modal').on('hidden.bs.modal', function () {
        $('span.percentage', '#uploader-progress').html(0);
        $('.notification', '#uploader-progress').hide();
        scope.$apply(function () {
          scope._queue = [];
          scope._queueSize = 0;
          scope._uprogress = false;
        });
      });
    }
  };
});