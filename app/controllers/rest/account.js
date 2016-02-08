/**
 * REST Account Controller
 * ************************************************
 */
var config = null;

var colors = require('colors');

var segmentio = require('analytics-node'),
	analytics = null;

var httpClient = require('request');
var async = require('async');

var mysql = require('mysql'),
	pool = null;

var redis = require('redis'),
	redCli = null;

var mandrill = require('mandrill-api');

var crypto = require('crypto'),
	rand = require('rand-token'),
	encoder = require('../../../utils/password-encoder');

var stripe = {},
	stripePlans = {};

var AccountController = module.exports = function(cfg) {
	config = cfg;
	stripePlans = cfg.stripe.plans;
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
 * [get_settings description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.get_settings = function(req, res) {
	var _res = res,
		_req = req;

	if(!_req.session.loggedin)
		return _res.json(500, {});

	_getSettings(_req.session.user.id, fetched);
	
	function fetched(err, settings) {
		if(!err) {
			//redCli.set('usr_' + _req.session.user.id + '_plan', settings.subscription.plan);
			_res.json(200, { settings: settings/*, plans: stripePlans*/ });
		}
		else _res.json(500, { err: 'error' });
	}
};

/**
 * [put_fullname description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.put_fullname = function(req, res) {
	var _res = res,
		_req = req;

	pool.getConnection(function(err, connection) 
	{
		connection.query('UPDATE users SET firstname = ?, lastname = ? WHERE id = ?', 
			[_req.body.firstname, _req.body.lastname, _req.session.user.id], function(err, rows, fields) 
		{
			if(!err) {
				_res.json(200, { success: 'ok', message: 'Full name updated succesfully.' });
			}
			else _res.json(500, { error: 'error' });
		});
	});
};

/**
 * [put_changePassword description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.put_changePassword = function(req, res) {
	var _res = res,
		_req = req;

	if(_req.body.pwdnew != _req.body.pwdcheck) 
		return _res.json(500, { error: 'error', message: 'The passwords are not matching!' });

	pool.getConnection(function(err, connection) 
	{
		connection.query('SELECT * FROM users WHERE id=' + _req.session.user.id, function(err, rows, fields) {
			connection.release();

			if(undefined != rows && rows.length != 0) {
				salt = rows[0].salt;
				var psalted = encoder.encodePassword(_req.body.pwdnew, salt);
				pool.getConnection(function(err, connection) 
				{
					connection.query('UPDATE users SET password = ? WHERE id = ?', [psalted, _req.session.user.id], function(err, rows, fields) {
						if(!err) {
							_res.json(200, { success: 'ok', message: 'Password changed succesfully' });
						}
						else _res.json(500, { error: 'error' });
					});
				});
			}
			else _res.json(500, { error: 'error' });
		});
	});
};

/**
 * [register description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.post_register = function(req, res) {
	var _res = res,
		_req = req;

	if(undefined == _req.body.password || _req.body.password.length < 6) {
		_res.json(500, { error: 'invalid_password', message: 'Password must be at least 6 characters length' });
	} 

	var salt = encoder.generateSalt();
	var user = 
	{
		email: req.body.email,
		password: encoder.encodePassword(req.body.password, salt),
		salt: salt,
		apikey: rand.generate(40),
		masterkey: rand.generate(40),
		tenant_id: rand.generate(88),
		enabled: 0,
		created: new Date()
	};

	function checkPsw(password, user, callback) {
		if(undefined == password || password.length < 6) {
			callback({ error: 'invalid_password', message: 'Password must be at least 6 characters length' });
		}
		callback(null, user);
	}

	function saveUser(user, callback) {
		pool.getConnection(function(err, connection) 
		{
			connection.query('INSERT INTO users SET ?', user, function(err, result) {
				connection.release();

				if(!err) {
					user['id'] = result.insertId;
					analytics.identify({
						userId: 'user-' + user.id,
						traits: {
							email: user.email,
							created: new Date(),
							ip: req.session['ip']
						}
					});
					analytics.track({
						userId: 'user-' + user.id,
						event: 'user:signup',
						properties: {
							email: user.email,
							ip: req.session['ip']
						}
					});
					_createSandbox(user); // creates a sandbox app for the new user and update him with the generated tenant_id
					var restAccount = require('./billing')(config);
					restAccount._createStripeCustomer(user.id, user.email, stripePlans.starter.id); // creates a new Stripes customer
					callback(null, user.email);
				}
				else callback({ error:'invalid_email', message: 'The provided email is already in use.' }, null);
			});
		});
	}

	function sendActivationLink(to, callback) {
		var ehash = encoder.encodePassword(user.email, user.salt);
		var mand = new mandrill.Mandrill(config.mandrill_token, true);
		var link = _req.protocol + '://' + _req.get('host') + '/account/activate?email=' + to + '&hash=' + ehash;

		var message = {
			subject: 'Teech.io Account Activation',
			from_email: 'support@teech.io',
			from_name: 'Teech.io',
			to: [{ email: to, name: '' }],
			merge_vars: [{
				rcpt: to,
				vars: [
					{ name: 'account_username', content: to },
					{ name: 'activation_link', content: link }
				]
			}]
		}
		var params = {
			template_name: 'teech-opt-in',
			template_content: [],
			message: message
		}
		mand.messages.sendTemplate(params, function(res) {
			callback(null, res);
		}, 
		function(err) {
			callback(err, null);
		});
	}

	var createUser = async.compose(sendActivationLink, saveUser, checkPsw);
	createUser(_req.body.password, user, function(err, res) {
		if(!err) {
  			_req.session.loggedin = true;
  			_req.session.user = {
  				id: user.id,
  				email: user.email,
		  		ehash: require('crypto').createHash('md5').update(user.email).digest('hex'),
  				apikey: user.apikey,
  				masterkey: user.masterkey,
  			};
			_req.session.flash = {
				clazz: 'warning',
				message: 'Your email address is not verified yet. Check your inbox for the verification link.' 
			}
			_res.json(200, { msg: 'success' });
		}
		else {
			_res.json(500, err);
		}
 	});
};

/**
 * [forgotPassword description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.get_sendPasswordReset = function(req, res) {
	var _res = res,
		_req = req;

	function generateHash() {
		var token = new Date();
			token += _req.ip;
			token += _req.headers['user-agent'];
		var sha1 = crypto.createHash('sha1');
		var md5 = crypto.createHash('md5');
		return sha1.update(encoder.uniqid(md5.update(token))).digest('hex');
	}

	function checkUser(email, callback) {
		pool.getConnection(function(err, connection) 
		{
			connection.query('SELECT * FROM users WHERE email = ?', email, function(err, rows, fields) {
				connection.release();

				if(undefined != rows && rows.length != 0) {
					var pwdreset = {
						token: generateHash(),
						user: rows[0].id,
						created: new Date()
					}
					connection.query('INSERT INTO pswresets SET ?', pwdreset, function(err, result) {
						if(!err) callback(null, email, pwdreset.token);
					});
				}
				else callback({ error: '', message: 'We were unable to find you!' });
			});
		});
	}

	function sendLink(to, token, callback) {
		var mand = new mandrill.Mandrill(config.mandrill_token, true);
		var link = _req.protocol + '://' + _req.get('host') + '/account/reset/?' + 'email=' + to + '&tok=' + token;

		var message = {
			subject: 'Teech.io Password Reset',
			from_email: 'support@teech.io',
			from_name: 'Teech.io',
			to: [{ email: to, name: '' }],
			merge_vars: [{
				rcpt: to,
				vars: [
					{ name: 'reset_psw_url', content: link }
				]
			}]
		}
		var params = {
			template_name: 'resetpsw',
			template_content: [],
			message: message
		}
		mand.messages.sendTemplate(params, function (res) {
			callback(null, res);
		},
		function (err) {
			callback({ error: err, message: 'Ooops! We had a problem sending you the reset link!' })
		});	
	}

	var sendReset = async.compose(sendLink, checkUser);
	sendReset(_req.query.email, function(err, res) {
		if(!err) {
			_res.json(200, { success: 'ok' });
		} else {
			_res.json(500, err); 
		}
	});
};

/**
 * [doPasswordReset description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.post_doPasswordReset = function(req, res) {
	var _res = res,
		_req = req;

	function validateResetToken(token, passwords, callback) {
		pool.getConnection(function(err, connection) 
		{
			connection.query('SELECT * FROM pswresets WHERE token = ? ORDER BY created', token, function(err, rows, fields) {
				if(undefined != rows && rows.length != 0) 
				{
					var created = rows[0].created;
					var time_diff = new Date() - created;
					// 900000 = 15 minutes in milliseconds
					if(time_diff < 900000) {
						callback(null, passwords);
					}
					else callback({ code: 500, error: 'expired_reset' });
				}
			});
		});
	}

	function changePassword(body, callback) {
		if(body.password != body.password_check) 
			return callback({ code: 500, error: 'error', message: 'The passwords are not matching!' });

		pool.getConnection(function(err, connection) 
		{
			connection.query('SELECT * FROM users WHERE id=' + _req.session.pwdreset.user, function(err, rows, fields) {
				connection.release();

				if(undefined != rows && rows.length != 0) {
					salt = rows[0].salt;
					var psalted = encoder.encodePassword(_req.body.password, salt);
					pool.getConnection(function(err, connection) 
					{
						connection.query('UPDATE users SET password = ? WHERE id = ?', [psalted, _req.session.pwdreset.user], function(err, rows, fields) {
							if(!err) {
								connection.query('DELETE FROM pswresets WHERE user = ?', _req.session.pwdreset.user);
								_req.session.pwdreset = {};
								_req.session.flash = {
									clazz: 'success',
									message: 'Your password is updated, you can login now.' 
								}
								callback(null, '');
							}
						});
					});
				}
				else callback({ code: 500, error: 'expired_reset' });
			});
		});
	}

	var resetPassword = async.compose(changePassword, validateResetToken);
	resetPassword(_req.session.pwdreset.token, _req.body, function(err, res) {
		if(!err) {
			_res.json(200, { success: 'ok' });
		} else {
			_res.json(500, err);
		} 
	});
};

/**
 * [_createSandbox description]
 * @param  {[type]} user [description]
 * @return {[type]}      [description]
 */
function _createSandbox(user) {
	var h = {
		url: 'http://' + config.api.host + '/service/' + user.masterkey + '/' + user.apikey + '/app',
		headers: {
			'Teech-Service-Master-Token': config.api.master_token
		},
		method: 'POST',
		json: {
			name: 'Sandbox',
			sandbox: true
		}
	}

	httpClient(h, function(err, res, body) {
		if(!err) {
			pool.getConnection(function(err, connection) 
			{
				connection.query('UPDATE users SET tenant_id = ? WHERE id = ?', [ body._tenantID, user.id ], function(err, result) {
					if(!err)
						return true;
					else
						return false;
				});
				connection.release();
			});
		}
	});
}
exports._createSandbox = _createSandbox;

/**
 * [_getSettings description]
 * @param  {[type]}   user_id  [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
function _getSettings(user_id, callback) {
	pool.getConnection(function(err, connection) {
		connection.query('SELECT * FROM users WHERE id = ?', user_id, function(err, rows, fields) {
			connection.release();

			if(rows && rows.length != 0 && rows[0].stripe_id) {
				var user = {
					id: rows[0].id,
					email: rows[0].email,
					firstname: rows[0].firstname,
					lastname: rows[0].lastname,
					fullname: rows[0].firstname + ' ' + rows[0].lastname,
					ehash: require('crypto').createHash('md5').update(rows[0].email).digest('hex'),
					apikey: rows[0].apikey,
					masterkey: rows[0].masterkey,
					enabled: rows[0].enabled
				};
				callback(null, user);
			}
			else callback(err, null);
			/*
			if(rows && rows.length != 0 && rows[0].stripe_id) {
				var billing = require('./billing')(config);
				billing._fetchCustomer(rows[0].stripe_id, function(err, customer) {
					if(!err) 
					{
						var user = {
							id: rows[0].id,
							email: rows[0].email,
							firstname: rows[0].firstname,
							lastname: rows[0].lastname,
							fullname: rows[0].firstname + ' ' + rows[0].lastname,
							ehash: require('crypto').createHash('md5').update(rows[0].email).digest('hex'),
							apikey: rows[0].apikey,
							masterkey: rows[0].masterkey,
							enabled: rows[0].enabled
						};
						var subscription = customer.subscriptions.data[0];
						var card = customer.cards.data[0] || {};
						user['default_card'] = customer.default_card;
						user['subscription'] = { 
							id: subscription.id,
							cusid: rows[0].stripe_id,
							plan: subscription.plan.name,
							amount: subscription.plan.amount
						};
						user['card'] = {
							last4: card['last4'],
							exp_month: card['exp_month'],
							exp_year: card['exp_year']
						}; 
						callback(null, user);
					}
					else callback(err, null);
				});
			}
			*/
		});
	});
};
exports._getSettings = _getSettings;