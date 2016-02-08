var config = null;

var httpClient = require('request');

var HooksController = module.exports = function(cfg) {
	config = cfg;
	return exports;
};

/**
 * [hook_sandboxCreated description]
 * @return {[type]} [description]
 */
exports.hook_sandboxCreated = function() {

};
