var config = null;

var segmentio = require('analytics-node'),
	analytics = null;

var httpClient = require('request');
var async = require('async');

var mysql = require('mysql'),
	pool = null;

var mandrill = require('mandrill-api');
var mailchimp = require('mailchimp-api/mailchimp');

var rand = require('rand-token'),
	encoder = require('../../utils/password-encoder');

var stripePlans = null;

var AccountController = module.exports = function(cfg) {
	config = cfg;
	stripePlans = cfg.stripe.plans;
	pool = mysql.createPool(config.mysql);
	analytics = new segmentio(config.analytics.write_key);
	return exports;
};

/**
 * [index description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.index = function(req, res) {
	if(req.session.loggedin)
		return res.redirect('/');
	res.render('partials/login', { bodyId: 'login-page' });
};

/**
 * [register description]
 * @return {[type]} [description]
 */
exports.signup = function(req, res) {
	if(req.session.loggedin)
		return res.redirect('/');
	res.render('partials/signup', { bodyId: 'signup-page', email: req.param('email') });
};

/**
 * [auth description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.auth = function(req, res) {
	var _res = res,
		_req = req;

	pool.getConnection(function(err, connection) {
		connection.query('SELECT * FROM users WHERE email=' + connection.escape(req.body.email), function(err, rows, fields) {
			connection.release();

			if(undefined == rows || rows.length == 0) {
				_res.json(500, { message: 'Your credentials are not valid'});
			} 
			else {
				var salt = rows[0].salt;
				var psalted = encoder.encodePassword(req.body.password, salt);
				
				if(rows[0].password === psalted) 
				{
					if(rows[0].enabled != 1) {
						_req.session.flash = {
							clazz: 'warning',
							message: 'Your email address is not verified yet. Check your inbox for the verification link.'
						}
					}

					// create a Stripe customer eventually
					if(!rows[0].stripe_id) {
						var restAccount = require('./rest/billing')(config);
						restAccount._createStripeCustomer(rows[0].id, rows[0].email, stripePlans.starter.id);
					}
					// start session
		  			_req.session.loggedin = true;
		  			_req.session.user = {
		  				id: rows[0].id,
		  				email: rows[0].email,
		  				ehash: require('crypto').createHash('md5').update(rows[0].email).digest('hex'),
		  				apikey: rows[0].apikey,
		  				masterkey: rows[0].masterkey,
		  			};
					analytics.track({
						userId: 'user-' + rows[0].id,
						event: 'user:login',
						properties: {
							email: rows[0].email,
							service: 'teechio',
							verified: (rows[0].enabled) ? 0 : 1,
							ip: req.session['ip']
						}
					});
					_res.json(200, { success: 'valid' });
				}
				else _res.json(500, { message: 'Your credentials are not valid'});
			}
		});
	});
};

/**
 * [auth_github description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.authGithub = function(req, res) {
	var _res = res;
	var _req = req;

	if(!_req.param('code')) {
		_res.redirect('https://github.com/login/oauth/authorize?scope=user:email&client_id=' + config.github.client_id);
	}
	else {
		var session_code = req.param('code');

		function requestToken(sessionCode, callback) {
			var h = {
				uri: 'https://github.com/login/oauth/access_token',
				method: 'POST',
				json: {
					client_id: config.github.client_id,
					client_secret: config.github.client_secret,
					code: session_code
				}
			}
			httpClient(h, function(err, res, body) {
				if(!err) {
					callback(null, body.access_token);
				}
				else callback(err, body);
			});
		}

		function fetchUser(accessToken, callback) {
			var h = {
				uri: 'https://api.github.com/user/emails?access_token=' + accessToken,
				method: 'GET',
				headers: {
					'User-Agent': 'Teechio LTD.'
				}
			}
			httpClient(h, function(err, res, body) {
				if(!err) {
					var emails = JSON.parse(body);
					callback(null, emails[0].email);
				}
				else callback(err, body);
			});
		}

		function checkUser(email, callback) {
			pool.getConnection(function(err, connection) {
				connection.query('SELECT * FROM users WHERE email= ?', email, function(err, rows, fields) {
					connection.release();

					if(undefined == rows || rows.length == 0) {
						callback(null, { code: 1200, email: email });
					} 
					else if(rows[0].enabled != 1) {
						 callback(null, { code: 1201, data: rows })
					} 
					else callback(null, { code: 1202, data: rows });
				});
			});
		}

		var authGithub = async.compose(checkUser, fetchUser, requestToken);
		authGithub(session_code, function(err, res) {
			if(!err && (res.code == 1202 || res.code == 1201)) {
				// create a Stripe customer eventually
				if(!res.data[0].stripe_id) {
					var restAccount = require('./rest/billing')(config);
					restAccount._createStripeCustomer(res.data[0].id, res.data[0].email, stripePlans.starter.id);
				}
				// start the session
	  			_req.session.loggedin = true;
	  			_req.session.user = {
	  				id: res.data[0].id,
	  				email: res.data[0].email,
		  			ehash: require('crypto').createHash('md5').update(res.data[0].email).digest('hex'),
	  				apikey: res.data[0].apikey,
	  				masterkey: res.data[0].masterkey,
	  			};
				analytics.track({
					userId: 'user-' + res.data[0].id,
					event: 'user:login',
					properties: {
						email: res.data[0].email,
						service: 'github',
						verified: (res.code == 1202) ? 1 : 0,
						ip: req.session['ip']
					}
				});
			}
			// user has an account and it's verified
			if(!err && res.code == 1202) 
			{
				_res.redirect('/');
			}
			// user has an account but it's not verified
			if(!err && res.code == 1201) 
			{
				_req.session.flash = {
					clazz: 'warning',
					message: 'Your email address is not verified yet. Check your inbox for the verification link.'
				}
				_res.redirect('/');
			}
			// user does not have an account
			if(!err && res.code == 1200) 
			{
				_req.session.flash = {
					clazz: 'success',
					message: 'You\'re one step away from getting in, just choose your password!' 
				}
				_res.redirect('/signup?email=' + res.email);
			}
		});
	}
};

/**
 * [activate description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.activate = function(req, res) {
	var _res = res,
		_req = req;

	var email = req.query.email,
		ehash = req.query.hash;

	function getSalt(email, ehash, callback) {
		pool.getConnection(function(err, connection) 
		{
			connection.query('SELECT * FROM users WHERE email=' + connection.escape(email), function(err, rows, fields) {
				connection.release();

				if(rows.length == 0) {
					callback({ error: 'invalid_credentials', message: 'Invalid credentials!'}, null);
				} else {
					if(ehash !== encoder.encodePassword(email, rows[0].salt)) {
						callback({ error: 'invalid_credentials', message: 'Invalid credentials!' });
					} 
					else {
						callback(null, rows[0]);
					}
				}
			});
		});
	}

	function subscribeToNewsletter(user, callback) {
		var mcapi = new mailchimp.Mailchimp(config.mailchimp.token);
		mcapi.lists.subscribe({ id: config.mailchimp.list_id, email: { email: user.email }, merge_vars: [], email_type: 'html', double_optin: false}, 
			function (res) {
				callback(null, user);
			},
			function (err) {
				var msg = '';
				if(err.code == 214)
					msg = 'Your account seems to be verified already.';
				callback({ error: err, message: msg });
			}
		);
	}

	function activate(user, callback) {
		pool.getConnection(function(err, connection) 
		{
			connection.query('UPDATE users SET enabled=1 WHERE email= ? AND enabled=0', [user.email], function(err, result) {
				connection.release();

				if(!err) {
					callback(null, user);
				}
				else { callback({ error: err, message: '' }) }
			});
		});
	}

	var activateUser = async.compose(activate, subscribeToNewsletter, getSalt);
	activateUser(email, ehash, function(err, user) {
		if(!err) {
			_req.session.flash = {
				clazz: 'success',
				message: 'You\'re account was succesfully verified.' 
			}
			analytics.track({
				userId: 'user-' + user.id,
				event: 'user:account:activation',
				properties: {
					email: user.email,
					ip: req.session['ip']
				}
			});
			_res.redirect('/');
		}
		else { 
			console.log(err)
			_res.render('error', err); 
		}
	});
};

/**
 * [resetPassword description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.resetPassword = function(req, res) {
	var _res = res,
		_req = req;

	pool.getConnection(function(err, connection) 
	{
		connection.query('SELECT * FROM pswresets WHERE token = ? ORDER BY created', req.query.tok, function(err, rows, fields) {
			connection.release();

			if(undefined != rows && rows.length != 0) 
			{
				var stored_token = rows[0].token,
					created = rows[0].created;
				var time_diff = new Date() - created;
				// 900000 = 15 minutes in milliseconds
				if(time_diff < 900000) {
					_req.session.pwdreset = {
						token: stored_token,
						user: rows[0].user
					};
					_res.render('partials/reset', { bodyId: 'pwd-reset-page' });	
				}
				else _res.redirect('/');
			}
			else _res.redirect('/');
		});
	});
};

/**
 * [logout description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.logout = function(req, res) {
	analytics.track({
		userId: 'user-' + req.session.user.id,
		event: 'user:logout',
		properties: {
			ip: req.session['ip']
		}
	});
	req.session = null;
	res.redirect('/signin');
};