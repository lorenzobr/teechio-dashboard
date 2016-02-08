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