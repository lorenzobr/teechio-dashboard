(function (window, document, undefined) {
  'use strict';
  var start = '2014-09-15', end = moment.utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
  var teechioShowcase = angular.module('teechioShowcase', []);
  teechioShowcase.config([
    '$interpolateProvider',
    function ($interpolateProvider) {
      $interpolateProvider.startSymbol('{[').endSymbol(']}');
    }
  ]);
  teechioShowcase.factory('$acache', [
    '$cacheFactory',
    function ($cacheFactory) {
      return {
        get: function (key) {
          var cache = localStorage.getItem(key);
          try {
            cache = JSON.parse(localStorage.getItem(key));
            return cache;
          } catch (err) {
            return cache;
          }
        },
        put: function (key, value) {
          typeof value === 'string' ? localStorage.setItem(key, value) : localStorage.setItem(key, JSON.stringify(value));
        },
        remove: function (key) {
          localStorage.removeItem(key);
        }
      };
    }
  ]);
  /**
	 * [description]
	 * @return {[type]} [description]
	 */
  teechioShowcase.directive('usersActivity', [
    '$http',
    function ($http) {
      return {
        restrict: 'EA',
        link: function (scope, element, attr) {
          var query = {
              startDate: start,
              endDate: end,
              aggregate: '%23count',
              group: 'date',
              sort: 'date'
            };
          $http.get('/demo/analytics', { params: query }).success(function (data) {
            var chart = AmCharts.makeChart(element.attr('id'), {
                type: 'serial',
                dataProvider: data,
                pathToImages: 'http://www.amcharts.com/lib/3/images/',
                graphs: [{
                    fillAlphas: 1,
                    valueField: 'count',
                    lineColor: '#FFFFFF'
                  }],
                chartCursor: {
                  categoryBalloonDateFormat: 'DD MMMM',
                  cursorPosition: 'mouse'
                },
                valueAxes: [{
                    position: 'left',
                    labelsEnabled: false,
                    gridAlpha: 0,
                    axisAlpha: 0
                  }],
                categoryField: 'date',
                categoryAxis: {
                  minPeriod: 'DD',
                  parseDates: true,
                  gridAlpha: 0,
                  axisAlpha: 0.4
                }
              });
          }).error(function (err) {
          });
        }
      };
    }
  ]);
  /**
	 * [description]
	 * @param  {[type]} $http [description]
	 * @return {[type]}       [description]
	 */
  teechioShowcase.directive('topFiveCorrect', [
    '$http',
    function ($http) {
      return {
        restrict: 'EA',
        link: function (scope, element, attr) {
          var query = {
              startDate: start,
              endDate: end,
              aggregate: '%23count',
              filters: 'action.action %23eq responsetrue',
              group: 'session.usermail',
              sort: 'count:-1',
              pageSize: 5
            };
          $http.get('/demo/analytics', { params: query }).success(function (data) {
            var chart = AmCharts.makeChart(element.attr('id'), {
                type: 'serial',
                dataProvider: data,
                pathToImages: 'http://www.amcharts.com/lib/3/images/',
                valueAxes: [{
                    position: 'left',
                    title: '',
                    maximum: data[0].count,
                    autoGridCount: false,
                    gridCount: 20,
                    labelsEnabled: false,
                    gridAlpha: 0
                  }],
                startDuration: 1,
                graphs: [{
                    fillAlphas: 0.9,
                    type: 'column',
                    valueField: 'count',
                    lineColor: '#72C23A'
                  }],
                rotate: true,
                chartCursor: {
                  categoryBalloonDateEnabled: false,
                  cursorAlpha: 0,
                  zoomable: false
                },
                categoryField: 'session_usermail',
                categoryAxis: {
                  gridPosition: 'start',
                  gridAlpha: 0.3
                }
              });
          }).error(function (err) {
          });
        }
      };
    }
  ]);
  /**
	 * [description]
	 * @param  {[type]} $http [description]
	 * @return {[type]}       [description]
	 */
  teechioShowcase.directive('topFiveWrong', [
    '$http',
    function ($http) {
      return {
        restrict: 'EA',
        link: function (scope, element, attr) {
          var query = {
              startDate: start,
              endDate: end,
              aggregate: '%23count',
              filters: 'action.action %23eq responsefalse',
              group: 'session.usermail',
              sort: 'count:-1',
              pageSize: 5
            };
          $http.get('/demo/analytics', { params: query }).success(function (data) {
            var chart = AmCharts.makeChart(element.attr('id'), {
                type: 'serial',
                dataProvider: data,
                pathToImages: 'http://www.amcharts.com/lib/3/images/',
                valueAxes: [{
                    position: 'left',
                    title: '',
                    maximum: data[0].count,
                    autoGridCount: false,
                    gridCount: 20,
                    labelsEnabled: false,
                    gridAlpha: 0
                  }],
                startDuration: 1,
                graphs: [{
                    fillAlphas: 0.9,
                    type: 'column',
                    valueField: 'count',
                    lineColor: '#cc3333'
                  }],
                rotate: true,
                chartCursor: {
                  categoryBalloonDateEnabled: false,
                  cursorAlpha: 0,
                  zoomable: false
                },
                categoryField: 'session_usermail',
                categoryAxis: {
                  gridPosition: 'start',
                  gridAlpha: 0.3
                }
              });
          }).error(function (err) {
          });
        }
      };
    }
  ]);
  /**
	 * [description]
	 * @param  {[type]} $http [description]
	 * @return {[type]}       [description]
	 */
  teechioShowcase.directive('topFiveFastest', [
    '$http',
    function ($http) {
      return {
        restrict: 'EA',
        link: function (scope, element, attr) {
          var query = {
              startDate: start,
              endDate: end,
              aggregate: '%23count,%23avg(action.duration)',
              filters: '(action.action %23eq responsetrue %23or action.action %23eq responsefalse)',
              group: 'session.usermail',
              postProcessingFilters: 'count %23gte 10',
              select: 'avg.action.duration,session.usermail',
              sort: 'avg.action.duration',
              pageSize: 5
            };
          $http.get('/demo/analytics', { params: query }).success(function (data) {
            var refactoredData = [];
            $.each(data, function (key, item) {
              refactoredData.push({
                usermail: item['session_usermail'],
                avgActionDuration: d3.format('.1f')(item['avg_action_duration'] / 1000)
              });
            });
            var chart = AmCharts.makeChart(element.attr('id'), {
                type: 'serial',
                dataProvider: refactoredData,
                pathToImages: 'http://www.amcharts.com/lib/3/images/',
                valueAxes: [{
                    position: 'left',
                    title: '',
                    maximum: _.findLast(refactoredData, function (item) {
                      return item.avgActionDuration;
                    }),
                    autoGridCount: false,
                    gridCount: 20,
                    labelsEnabled: false,
                    gridAlpha: 0
                  }],
                startDuration: 1,
                graphs: [{
                    fillAlphas: 0.9,
                    type: 'column',
                    valueField: 'avgActionDuration',
                    lineColor: '#1576BD'
                  }],
                rotate: true,
                chartCursor: {
                  categoryBalloonDateEnabled: false,
                  cursorAlpha: 0,
                  zoomable: false
                },
                categoryField: 'usermail',
                categoryAxis: {
                  gridPosition: 'start',
                  gridAlpha: 0.3
                }
              });
          }).error(function (err) {
          });
        }
      };
    }
  ]);
  /**
	 * [description]
	 * @param  {[type]} $http [description]
	 * @return {[type]}       [description]
	 */
  teechioShowcase.directive('usersHintsAvg', [
    '$http',
    function ($http) {
      return {
        restrict: 'EA',
        link: function (scope, element, attr) {
          function countSessionsPerUser(start, end, callback) {
            var query = {
                startDate: start,
                endDate: end,
                aggregate: '%23count',
                group: 'session.usermail',
                sort: 'session.usermail'
              };
            $http.get('/demo/analytics', { params: query }).success(function (data) {
              callback(null, start, end, data);
            }).error(function (err) {
              callback(err, null);
            });
          }
          function totalHintsPerUser(start, end, totalSessions, callback) {
            var query = {
                startDate: start,
                endDate: end,
                aggregate: '%23sum(action.hintNumber)',
                filters: 'action.action %23eq hint',
                group: 'session.usermail',
                sort: 'session.usermail'
              };
            $http.get('/demo/analytics', { params: query }).success(function (data) {
              var refactoredData = [];
              $.each(data, function (key, item) {
                $.each(totalSessions, function (inner_key, inner_item) {
                  if (inner_item['session_usermail'] == item['session_usermail']) {
                    item['count'] = inner_item['count'];
                    item['avgHintsPerSession'] = item['sum_action_hintNumber'] / item['count'];
                    if (item['avgHintsPerSession'] > 0) {
                      var child = {
                          name: item['session_usermail'],
                          value: Math.round(item['avgHintsPerSession'] * 100) / 100,
                          y: Math.random() * (7 - 5) + 5,
                          x: Math.random() * (7 - 5) + 5
                        };
                      refactoredData.push(child);
                    }
                    return false;
                  }
                });
              });
              callback(null, refactoredData);
            }).error(function (err) {
              callback(err, null);
            });
          }
          var renderSessionsHintsAvg = async.compose(totalHintsPerUser, countSessionsPerUser);
          renderSessionsHintsAvg(start, end, function (err, data) {
            var chart = AmCharts.makeChart(element.attr('id'), {
                type: 'xy',
                pathToImages: 'http://www.amcharts.com/lib/3/images/',
                theme: 'none',
                dataProvider: data,
                startDuration: 1.5,
                valueAxes: [
                  {
                    position: 'bottom',
                    axisAlpha: 0,
                    labelsEnabled: false
                  },
                  {
                    position: 'left',
                    axisAlpha: 0,
                    labelsEnabled: false
                  }
                ],
                graphs: [{
                    balloonText: 'user:<b>[[name]]</b>, hints: <b>[[value]]</b>',
                    bullet: 'circle',
                    bulletBorderAlpha: 0.6,
                    bulletAlpha: 0.2,
                    lineAlpha: 0,
                    fillAlphas: 0,
                    valueField: 'value',
                    xField: 'x',
                    yField: 'y',
                    maxBulletSize: 100,
                    lineColor: '#FFFFFF'
                  }],
                marginLeft: 46,
                marginBottom: 35
              });
          });
        }
      };
    }
  ]);
  /**
	 * [description]
	 * @param  {[type]} $http [description]
	 * @return {[type]}       [description]
	 */
  teechioShowcase.directive('usersList', [
    '$http',
    function ($http) {
      return {
        restrict: 'EA',
        link: function (scope, element, attr) {
          var query = {
              startDate: start,
              endDate: end,
              aggregate: '%23count',
              group: 'session.usermail,session._id',
              select: 'session.usermail,session._id',
              sort: 'count:-1,session.usermail',
              postProcessingFilters: 'count %23gte 5'
            };
          $http.get('/demo/analytics', { params: query }).success(function (users) {
            scope.users = [];
            angular.forEach(users, function (item, index) {
              if (item.session_usermail) {
                var user = {
                    username: item.session_usermail,
                    slug: item.session_usermail.replace(' ', '_')
                  };
                scope.users.push(user);
              }
            });
          }).error(function (err) {
            console.log('error loading users');
          });
        }
      };
    }
  ]);
  /**
	 * [description]
	 * @param  {[type]} $http [description]
	 * @return {[type]}       [description]
	 */
  teechioShowcase.directive('answersDay', [
    '$http',
    function ($http) {
      return {
        restrict: 'EA',
        link: function (scope, element, attr) {
          function zoomChart(chart, data) {
            chart.zoomToIndexes(data.length - 10, data.length - 1);
          }
          var query = {
              startDate: start,
              endDate: end,
              aggregate: '%23count',
              filters: '(action.action %23eq responsetrue %23or action.action %23eq responsefalse) %23and session.usermail %23eq ',
              group: 'date,action.action',
              sort: 'date:1',
              filtered: scope.user
            };
          $http.get('/demo/analytics', { params: query }).success(function (data) {
            var dateCluster = {};
            $.each(data, function (key, item) {
              if (!dateCluster[item.date]) {
                dateCluster[item.date] = {
                  'correct': 0,
                  'wrong': 0
                };
              }
              if (item.action_action == 'responsetrue') {
                dateCluster[item.date].correct = item.count;
              } else if (item.action_action == 'responsefalse') {
                dateCluster[item.date].wrong = item.count;
              }
            });
            var refactoredData = [];
            $.each(dateCluster, function (key, item) {
              refactoredData.push({
                'date': key,
                'correct': item.correct,
                'wrong': item.wrong
              });
            });
            var chart = AmCharts.makeChart(element.attr('id'), {
                type: 'serial',
                dataProvider: refactoredData,
                dataDateFormat: 'YYYY-MM-DD',
                pathToImages: 'http://www.amcharts.com/lib/3/images/',
                valueAxes: [{
                    position: 'left',
                    title: '',
                    autoGridCount: false,
                    gridCount: 20,
                    labelsEnabled: false,
                    gridAlpha: 0,
                    axisAlpha: 0
                  }],
                startDuration: 1,
                graphs: [
                  {
                    balloonText: 'Wrong: <b>[[value]]</b>',
                    fillAlphas: 0.9,
                    type: 'column',
                    valueField: 'wrong',
                    lineColor: '#cc3333'
                  },
                  {
                    balloonText: 'Correct: <b>[[value]]</b>',
                    fillAlphas: 0.9,
                    type: 'column',
                    clustered: false,
                    columnWidth: 0.5,
                    valueField: 'correct',
                    lineColor: '#72C23A'
                  }
                ],
                chartScrollbar: {
                  autoGridCount: true,
                  graph: 'g1',
                  scrollbarHeight: 25
                },
                chartCursor: {
                  categoryBalloonDateEnabled: false,
                  cursorAlpha: 0,
                  zoomable: false
                },
                categoryField: 'date',
                categoryAxis: {
                  parseDates: true,
                  gridPosition: 'start',
                  gridAlpha: 0.3
                }
              });
            chart.addListener('rendered', zoomChart);
            zoomChart(chart, refactoredData);
          }).error(function (err) {
          });
        }
      };
    }
  ]);
  /**
	 * [description]
	 * @param  {[type]} $http [description]
	 * @return {[type]}       [description]
	 */
  teechioShowcase.directive('hintsCorrectSession', [
    '$http',
    function ($http) {
      return {
        restrict: 'EA',
        link: function (scope, element, attr) {
          function zoomChart(chart, data) {
            chart.zoomToIndexes(data.length - 10, data.length - 1);
          }
          function getHintsBySessions(start, end, user, callback) {
            var query = {
                startDate: start,
                endDate: end,
                aggregate: '%23sum(action.hintNumber)',
                filters: 'action.action %23eq hint %23and session.usermail %23eq ',
                group: 'session._id,date',
                sort: 'session._id',
                filtered: user
              };
            $http.get('/demo/analytics', { params: query }).success(function (data) {
              var hintsBySession = {};
              $.each(data, function (key, item) {
                hintsBySession[item.session__id] = {
                  'correct': 0,
                  'hints': item.sum_action_hintNumber,
                  'date': item.date
                };
              });
              callback(null, start, end, user, hintsBySession);
            }).error(function (err) {
              callback(err, null);
            });
          }
          function getAnswersBySession(start, end, user, hintsBySession, callback) {
            var query = {
                startDate: start,
                endDate: end,
                aggregate: '%23count',
                filters: 'action.action %23eq responsetrue %23and session.usermail %23eq ',
                group: 'session._id,date',
                sort: 'session._id',
                filtered: user
              };
            $http.get('/demo/analytics', { params: query }).success(function (data) {
              $.each(data, function (key, item) {
                if (!hintsBySession[item.session__id]) {
                  hintsBySession[item.session__id] = {
                    'correct': item.count,
                    'hints': 0,
                    'date': item.date
                  };
                } else {
                  hintsBySession[item.session__id].correct = item.count;
                }
              });
              var i = 1, refactoredData = [];
              $.each(hintsBySession, function (key, item) {
                refactoredData.push({
                  'game': '#' + i++,
                  'correct': item.correct,
                  'hints': item.hints,
                  'date': item.date
                });
              });
              callback(null, refactoredData);
            }).error(function (err) {
              callback(err, null);
            });
          }
          var renderHintCorrectSession = async.compose(getAnswersBySession, getHintsBySessions);
          renderHintCorrectSession(start, end, scope.user, function (err, data) {
            if (!err) {
              var chart = AmCharts.makeChart(element.attr('id'), {
                  type: 'serial',
                  dataProvider: data,
                  pathToImages: 'http://www.amcharts.com/lib/3/images/',
                  valueAxes: [{
                      position: 'left',
                      title: '',
                      labelsEnabled: false,
                      gridAlpha: 0,
                      axisAlpha: 0
                    }],
                  startDuration: 1,
                  graphs: [
                    {
                      id: 'g1',
                      balloonText: 'Hints: <b>[[value]]</b>',
                      fillAlphas: 0.9,
                      type: 'column',
                      valueField: 'hints',
                      lineColor: '#FDD202'
                    },
                    {
                      balloonText: 'Game played on: <b>[[date]]</b>; Correct answers: <b>[[value]]</b>',
                      fillAlphas: 0,
                      bullet: 'round',
                      dashLengthField: 'dashLengthLine',
                      valueField: 'correct',
                      lineColor: '#72C23A'
                    }
                  ],
                  chartScrollbar: {
                    autoGridCount: true,
                    graph: 'g1',
                    scrollbarHeight: 25
                  },
                  chartCursor: { currentPosition: 'mouse' },
                  categoryField: 'game',
                  categoryAxis: {
                    gridPosition: 'start',
                    gridAlpha: 0.3
                  }
                });
              chart.addListener('rendered', zoomChart);
              zoomChart(chart, data);
            }
          });
        }
      };
    }
  ]);
  /**
	 * [description]
	 * @param  {[type]} $http [description]
	 * @return {[type]}       [description]
	 */
  teechioShowcase.directive('hintsWord', [
    '$http',
    function ($http) {
      return {
        restrict: 'EA',
        link: function (scope, element, attr) {
          var query = {
              startDate: start,
              endDate: end,
              aggregate: '%23sum(action.hintNumber)',
              filters: 'action.action %23eq hint %23and session.usermail %23eq ',
              group: 'material.title',
              sort: 'sum_action_hintNumber:-1',
              filtered: scope.user
            };
          $http.get('/demo/analytics', { params: query }).success(function (data) {
            scope.saved_words = data.length;
            var chart = AmCharts.makeChart(element.attr('id'), {
                type: 'serial',
                dataProvider: data,
                pathToImages: 'http://www.amcharts.com/lib/3/images/',
                valueAxes: [{
                    position: 'left',
                    title: '',
                    autoGridCount: false,
                    gridCount: 20,
                    labelsEnabled: false,
                    gridAlpha: 0,
                    axisAlpha: 0
                  }],
                startDuration: 1,
                graphs: [{
                    balloonText: 'Hints for <b>[[material_title]]</b>: [[value]]',
                    fillAlphas: 1,
                    type: 'column',
                    valueField: 'sum_action_hintNumber',
                    lineColor: '#FFFFFF',
                    columnWidth: 0.4
                  }],
                chartCursor: {
                  categoryBalloonEnabled: false,
                  cursorAlpha: 0,
                  zoomable: true
                },
                categoryField: 'sum_action_hintNumber',
                categoryAxis: {
                  gridPosition: 'start',
                  gridAlpha: 0,
                  axisAlpha: 0,
                  labelsEnabled: false
                }
              });
          }).error(function (err) {
          });
        }
      };
    }
  ]);
  /**
	 * [description]
	 * @param  {[type]} $http [description]
	 * @return {[type]}       [description]
	 */
  teechioShowcase.directive('avgWidgets', [
    '$http',
    function ($http) {
      return {
        restrict: 'EA',
        link: function (scope, element, attr) {
          function getAvgCorrectAnswersPerSession(start, end, user, callback) {
            function doCalc(start, end, count, user, callback) {
              var query = {
                  startDate: start,
                  endDate: end,
                  aggregate: '%23count',
                  filters: 'session.usermail %23eq ',
                  group: 'session.usermail',
                  filtered: user,
                  method: '/sessions'
                };
              $http.get('/demo/analytics', { params: query }).success(function (data) {
                var avgCorrect = 0;
                var totalSessions = data[0] && data[0].count ? data[0].count : 0;
                if (totalSessions > 0) {
                  avgCorrect = d3.format('.1f')(count / totalSessions);
                }
                scope.avgCorrect = avgCorrect;
                callback(null, start, end, user, totalSessions);
              }).error(function (err) {
                callback(err, null);
              });
            }
            var query = {
                startDate: start,
                endDate: end,
                aggregate: '%23count',
                filters: 'action.action %23eq responsetrue %23and session.usermail %23eq ',
                group: 'action.action',
                filtered: user
              };
            $http.get('/demo/analytics', { params: query }).success(function (data) {
              var count = data[0] && data[0].count ? data[0].count : 0;
              doCalc(start, end, count, user, callback);
            }).error(function (err) {
              callback(err, null);
            });
          }
          function getAvgWrongAnswersPerSession(start, end, user, totalSessions, callback) {
            var query = {
                startDate: start,
                endDate: end,
                aggregate: '%23count',
                filters: 'action.action %23eq responsefalse %23and session.usermail %23eq ',
                group: 'action.action',
                filtered: user
              };
            $http.get('/demo/analytics', { params: query }).success(function (data) {
              var avgWrong = 0;
              var totalActions = data[0] && data[0].count ? data[0].count : 0;
              if (totalSessions > 0) {
                avgWrong = d3.format('.1f')(totalActions / totalSessions);
              }
              scope.avgWrong = avgWrong;
              callback(null, {});
            }).error(function (err) {
              callback(err, null);
            });
          }
          function getAvgTimeToAnswer(start, end, user, callback) {
            var query = {
                startDate: start,
                endDate: end,
                aggregate: '%23avg(action.duration)',
                filters: 'session.usermail %23eq ',
                group: 'session.usermail',
                filtered: user
              };
            $http.get('/demo/analytics', { params: query }).success(function (data) {
              var avgDuration = 0;
              if (data[0] && data[0].avg_action_duration > 0) {
                avgDuration = Math.round(data[0].avg_action_duration / 1000);
              }
              scope.avgDuration = avgDuration;
              callback(null, start, end, user);
            }).error(function (err) {
              callback(err, null);
            });
          }
          var renderAvgWidgets = async.compose(getAvgWrongAnswersPerSession, getAvgCorrectAnswersPerSession, getAvgTimeToAnswer);
          renderAvgWidgets(start, end, scope.user, function (err, data) {
          });
        }
      };
    }
  ]);
  window.teechioShowcase = teechioShowcase;
}(window, document));