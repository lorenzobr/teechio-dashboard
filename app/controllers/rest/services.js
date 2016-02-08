var config = null;

var segmentio = require('analytics-node'),
	analytics = null;

var httpClient = require('request');
var async = require('async');

var redis = require('redis'),
	redCli = null;

var ServiceController = module.exports = function(cfg) {
	config = cfg;
	redCli = redis.createClient(config.redis.port, config.redis.host, {
		auth_pass: config.redis.password
	});
	redis.debug_mode = config.redis.debug;
	analytics = new segmentio(config.analytics.write_key);
	return exports;
}

/**
 * [get_appsByKey description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.get_appsByKey = function(req, res) {
	var _res = res,
		_req = req;

	var h = {
		url: 'http://' + config.api.host + '/service/' + req.session.user.apikey + '/apps',
		headers: {
			'Teech-Service-Master-Token': config.api.master_token
		},
		method: 'GET',
		json: true
	};

	httpClient(h, function(err, res, body) {
		if(!err) {
			redCli.set('usr_' + _req.session.user.id + '_apps', body.length);
			_res.json(200, body);
		}
		else _res.json(500, { error: err });
	});
};

/**
 * [get_app description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.get_app = function(req, res) {
	var _res = res;

	var h = {
		url: 'http://' + config.api.host + '/service/' + req.session.user.apikey + '/app/' + req.params.appuid,
		headers: {
			'Teech-Service-Master-Token': config.api.master_token
		},
		method: 'GET',
		json: true
	};
	httpClient(h, function(err, res, body) {
		if(!err)
			_res.json(200, body);
	});
};

/**
 * [post_registerApp description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.post_registerApp = function(req, res) {
	var _res = res,
		_req = req;

	function getNapps(callback) {
		redCli.get('usr_' + _req.session.user.id + '_apps', function(err, napps) {
			callback(null, napps);
		});
	}

	function checkAllowance(napps, callback) {
		redCli.get('usr_' + _req.session.user.id + '_plan', function(err, plan) {
			/*
			if(undefined == plan) 
				callback({ error: 'error_checking_plan', message: 'Something went wrong with our servers.' }, null);
	
			if(plan == 'Starter' && napps >= 1) {
				callback({ error: 'not_allowed_plan', message: 'You reached your plan quota. Please, upgrade the plan in your account settings to add more apps.' }, null);
			}
			*/
			callback(null, plan);
		});
	} 

	// users on starter plans can have only 1 app
	// in their dashboard, so check before creating the app
	var createApp = async.compose(checkAllowance, getNapps);
	createApp(function(err, res) {
		if(!err) 
		{
			var h = {
				url: 'http://' + config.api.host + '/service/' + req.session.user.masterkey + '/' + req.session.user.apikey + '/app',
				headers: {
					'Teech-Service-Master-Token': config.api.master_token
				},
				method: 'POST',
				json: {
					name: req.body.name,
					sandbox: req.body.sandbox
				}
			}
			httpClient(h, function(err, res, body) {
				analytics.track({
					userId: 'user-' + _req.session.user.id,
					event: 'app:created',
					properties: {
						email: _req.session.user.email,
						ip: req.session['ip']
					}
				});
				_res.json(200, body)
			});
		}
		else _res.json(500, err);
	});
};

/**
 * [delete_deleteApp description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.delete_app = function(req, res) {
	var _res = res,
		_req = req;
	
	var h = {
		url: 'http://' + config.api.host + '/service/' + req.session.user.apikey + '/app/' + req.param('appuid') + '/delete',
		headers: {
			'Teech-Service-Master-Token': config.api.master_token
		},
		method: 'DELETE',
		json: true
	};
	httpClient(h, function(err, res, body) {
		analytics.track({
			userId: 'user-' + _req.session.user.id,
			event: 'app:deleted',
			properties: {
				email: _req.session.user.email,
				ip: req.session['ip']
			}
		});
		_res.json(200, body);
	});
};

/**
 * [get_statsByMonth description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.get_statsByMonth = function(req, res) {
	var __res = res;

	var h = {
		url: 'http://' + config.api.host + '/service/' + req.session.user.apikey + '/stats',
		headers: {
			'Teech-Service-Master-Token': config.api.master_token
		},
		method: 'GET',
		json: true
	};
	
	httpClient(h, function(err, res, body) {
		__res.json(200, body);
	});
};

/**
 * [get_statsByApp description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.get_statsByApp = function(req, res) {
	var __res = res;

	var h = {
		url: 'http://' + config.api.host + '/service/' + req.session.user.apikey + '/stats/' + req.params.appuid,
		headers: {
			'Teech-Service-Master-Token': config.api.master_token
		},
		method: 'GET',
		json: true
	};
	
	httpClient(h, function(err, res, body) {
		__res.json(200, body);
	});
};

/**
 * [get_statsStorage description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.get_statsStorage = function(req, res) {
	var __res = res;

	var h = {
		url: 'http://' + config.api.host + '/service/' + req.session.user.apikey + '/stats/storage',
		headers: {
			'Teech-Service-Master-Token': config.api.master_token
		},
		method: 'GET',
		json: true
	};

	httpClient(h, function(err, res, body) {
		__res.json(200, body);
	});
};