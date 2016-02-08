var express = require('express');
var app = express();

var config = require('./config/conf.json');
var envConf = (config.environment == 'dev') ?
	require('./config/dev.json') : require('./config/production.json');

app.configure(function()
{
	app.set('views', __dirname + '/app/views');
	app.set('view engine', 'jade');

	app.use(express.cookieParser());
	app.use(express.cookieSession({ secret: '64BOjS7b81937c5b229f33fb234', httpOnly: true }));

	app.use(express.bodyParser());
	app.use(express.compress());
	
	app.use('/public', express.static(__dirname + '/public'));

	app.use(function(req, res, next) {
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		var session = req.session;
		res.locals.session = session;

		try {
			var ip = 
				req.headers['x-forwarded-for'] || 
	     		req.connection.remoteAddress || 
	     		req.socket.remoteAddress ||
	     		req.connection.socket.remoteAddress;
	     	req.session['ip'] = ip;
     	} 
     	catch(err) { console.log(err) }
     	
		/*
		 * Flash messages implementation
		 */
  		var flash = session.flash || (session.flash = {});
		res.locals.flash = flash;
		next();
	});
});

var account = require('./app/controllers/account')(envConf);
app.get('/signin', account.index);
app.get('/signup', account.signup);
app.get('/auth/github', account.authGithub);
app.get('/account/activate', account.activate);
app.get('/account/reset', account.resetPassword);
app.post('/auth', account.auth);
app.get('/logout', account.logout);

var dashboard = require('./app/controllers/dashboard')(envConf);
app.get('/', dashboard.index);
app.get('/analytics/showcase/:usermail/detail', dashboard.analytics_details);
app.get('/analytics/showcase', dashboard.analytics);

var apiconsole = require('./app/controllers/rest/console')(envConf);
app.all('/console/call', apiconsole.call);
app.all('/console/upload', apiconsole.upload);

var services = require('./app/controllers/rest/services')(envConf);
app.get('/account/apps', services.get_appsByKey);
app.get('/account/app/:appuid', services.get_app);
app.get('/account/stats/apps', services.get_statsByMonth);
app.get('/account/stats/app/:appuid', services.get_statsByApp);
app.get('/account/stats/storage', services.get_statsStorage);
app.post('/account/app', services.post_registerApp);
app.delete('/account/app/:appuid', services.delete_app);

/**
 * Internal APIs
 */
var accountRest = require('./app/controllers/rest/account')(envConf);
app.get('/api/account/settings', accountRest.get_settings);
app.put('/api/account/fullname', accountRest.put_fullname);
app.put('/api/account/changepwd', accountRest.put_changePassword);
app.get('/api/account/forgot', accountRest.get_sendPasswordReset);
app.post('/api/account/doreset', accountRest.post_doPasswordReset);
app.post('/api/account/register', accountRest.post_register);

var billingRest = require('./app/controllers/rest/billing')(envConf);
app.post('/billing/customers', billingRest.post_customers);
app.post('/billing/customers/:customer_id/cards', billingRest.post_registerCCard);
app.post('/billing/customers/:customer_id/subscriptions', billingRest.post_subscribeToPlan);

var analyticsShowcase = require('./app/controllers/rest/analytics.demo')(envConf);
app.get('/demo/analytics', analyticsShowcase.get_analytics);

app.get('*', dashboard.index);

// Application start
var port = process.env.PORT || config.listening_port;
app.listen(port);
console.log('application: started and listening on port ' + port);
