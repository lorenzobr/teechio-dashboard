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