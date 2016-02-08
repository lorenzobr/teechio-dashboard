var config = null;

var segmentio = require('analytics-node'),
	analytics = null;

var httpClient = require('request');
var async = require('async');

var mysql = require('mysql'),
	pool = null;

var redis = require('redis'),
	redCli = null;

var stripe = {},
	stripePlans = {};

var BillingController = module.exports = function(cfg) {
	config = cfg;
	stripePlans = cfg.stripe.plans;;
	pool = mysql.createPool(config.mysql);
	redCli = redis.createClient(config.redis.port, config.redis.host, {
		auth_pass: config.redis.password
	});
	redis.debug_mode = config.redis.debug;
	stripe = require('stripe')(config.stripe.secret_key);
	stripe.setApiVersion('2014-03-28');
	analytics = new segmentio(config.analytics.write_key);
	return exports;
}

/**
 * [post_customers description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.post_customers = function(req, res) {
	var _res = res,
		_req = req;

	var customer = _createStripeCustomer(req.params.uid, req.body.email, req.body.plan);
	if(customer) {
		_res.json(200, { success: 'customer created' });
	}
	else {
		_res.json(500, { error: customer });
	}
};

/**
 * [post_registerCCard description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.post_registerCCard = function(req, res) {
	var _res = res,
		_req = req;

	function createCCard(card_token, customer_id, callback) {
		stripe.customers.createCard(customer_id, {
			card: card_token
		},
		function(err, card) {
			if(!err) {
				callback(null, card.id, customer_id);
			} else {
				callback(err);
			}
		});
	}

	function updateUserCCard(card_id, customer_id, callback) {
		stripe.customers.update(customer_id, {
			default_card: card_id
		}, 
		function(err, customer) {
			if(!err) {
				callback(null, card_id, customer_id);
			} else {
				callback(err);
			}
		});
	}

	var registerCCard = async.compose(updateUserCCard, createCCard);
	registerCCard(req.body.token, req.params.customer_id, function(err, res) {
		if(!err) {
			_res.json(200, { success: 'success' });
		} else {
			_res.json(500, { error: err });
		}
	});
};

/**
 * [post_subscribeToPlan description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.post_subscribeToPlan = function(req, res) {
	var _res = res,
		_req = req;

	var plan = req.body.plan;

	function getNapps(plan, callback) {
		redCli.get('usr_' + _req.session.user.id + '_apps', function(err, napps) {
			callback(null, plan, napps);
		});
	}

	function changeSubscrition(plan, napps, callback) {
		if((plan != stripePlans.indie.id && 
			plan != stripePlans.startup.id &&
			plan != stripePlans.business.id) && napps > 1) 
		{
			callback({ error: 'not_allowed_plan', message: 'You have too many apps connected. To downgrade to this plan, please delete some of your applications.'})
		} 
		else {
			stripe.customers.updateSubscription(req.params.customer_id, req.body.subscription, { 
				plan: plan
			},
		  	function(err, subscription) {
		  		console.log(subscription)
		  		if(!err) {
					analytics.track({
						userId: 'user-' + _req.session.user.id,
						event: 'user:plan:subscribed',
						properties: {
							email: _req.session.user.email,
							plan: plan
						}
					});
		  			callback(null, { success: 'success' });
		  		} else {
		  			callback({ error: err });
		  		}
		  	});
	  	}
	}

	var subscribeTo = async.compose(changeSubscrition, getNapps);
	subscribeTo(plan, function(err, res) {
		if(!err) {
			_res.json(200, { success: 'success' });
		}
		else {
			_res.json(500, { error: err });
		}
	});

};

/**
 * [_fetchCustomer description]
 * @param  {[type]}   stripe_id [description]
 * @param  {Function} callback  [description]
 * @return {[type]}             [description]
 */
exports._fetchCustomer = function(stripe_id, callback) {
	stripe.customers.retrieve(stripe_id, function(err, customer) {
		callback(err, customer);
	});
};

/**
 * [_createStripeCustomer description]
 * @param  {[type]} user_id [description]
 * @param  {[type]} email   [description]
 * @param  {[type]} plan    [description]
 * @return {[type]}         [description]
 */
function _createStripeCustomer(user_id, email, plan) {
	function newStripeCustomer(user_id, email, plan, callback) {
		stripe.customers.create({
			email: email,
			plan: plan
		}, 
		function(err, customer) {
			if(!err) {
				callback(null, customer.id, user_id);
			}
			else callback({ error: err });
		});
	}

	function updateTeechioUser(stripe_id, user_id, callback) {
		pool.getConnection(function(err, connection) {
			connection.query('UPDATE users SET stripe_id = ? WHERE id = ?', [stripe_id, user_id], function(err, rows, fields) {
				connection.release();
				if(!err) {
					return true;
				}
				else return err;
			});
		});
	}
	var createCustomer = async.compose(updateTeechioUser, newStripeCustomer);
	createCustomer(user_id, email, plan, function(err, res) {
		callback(err, res);
	});
}
exports._createStripeCustomer = _createStripeCustomer;
