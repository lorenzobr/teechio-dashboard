var config = null;

var DashboardController = module.exports = function(cfg) {
	config = cfg;
	return exports;
};

/**
 * [index description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.index = function(req, res) {
	if(undefined == req.session.loggedin || !req.session.loggedin)
		return res.redirect('/signin');
	var user = {
		id: req.session.id,
		email: req.session.user.email,
		apikey: req.session.user.apikey
	};
	res.render('partials/dashboard', { user: user });
};

/**
 * [analytics description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.analytics = function(req, res) {
	res.render('partials/analytics');
};

exports.analytics_details = function(req, res) {
	res.render('partials/analytics_details', { user: req.param('usermail').replace("_", " ") });
};