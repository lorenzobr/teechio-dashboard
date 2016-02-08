teechioDashboard.controller('WalkthroughController', [
  '$scope',
  '$route',
  function WalkthroughController($scope, $route) {
    $scope.currentPage = $route.current.$$route.controller;
  }
]);