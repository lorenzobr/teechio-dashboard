var config = null;

var httpClient = require('request');
var async = require('async');

var redis = require('redis'),
	redCli = null;

var Chance = require('chance'),
	chance = new Chance();

var last_names = {};

var q = async.queue(function(task, callback) {
	// conversion back to user email
	if(task.query['filtered']) {
		redCli.get('last_names', function(err, names) {
			if(!err) {
				var arr = JSON.parse(names);
				for(var key in arr) {
					var item = arr[key];
					if(item == task.query['filtered'])
						task.query.filters += key;
				}
				delete task.query['filtered'];
				doTask(task.query);
			}
		});
	} else doTask(task.query);

	function doTask(query) {
		// API request options
		var h = {
			uri: 'http://' + config.api.host + '/analytics',
			method: 'GET',
			headers: {
				'Teech-REST-API-Key': '0wh2OGVXJbbFhm3dVyyj5CjHu7hcplLkCrQUGL8c',
				'Teech-Application-Id': 'cyy6mwEW6D5AK1ONvGpIA8C1R8vqQv6O'
			},
			qs: query,
			json: true
		};
		if(query.method)
			h['uri'] += query.method;
		httpClient(h, function(error, response, body) {
			if(!error) {
				if(body[1] && body[1]['session_usermail']) {
					/**
					 * Hide real users emails for privacy purpose
					 */
					body.forEach(function(item, index) {
						var avatar = chance.name();
						if(!last_names[item.session_usermail]) {
							last_names[item.session_usermail] = avatar;
							body[index]['session_usermail'] = avatar;
						} else {
							body[index]['session_usermail'] = last_names[item.session_usermail];
						}
					});
					redCli.set('last_names', JSON.stringify(last_names));
				}
				callback(null, body);
			} else {
				callback(error, null);
			}
		});
	}
});

var AnalyticsController = module.exports = function(cfg) {
	config = cfg;
	redCli = redis.createClient(config.redis.port, config.redis.host, {
		auth_pass: config.redis.password
	});
	redis.debug_mode = false;
	return exports;
};

/**
 * [index description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.get_analytics = function(req, res) {
	q.push({ query: req.query }, function(err, body) {
		res.json(200, body);
	});
};