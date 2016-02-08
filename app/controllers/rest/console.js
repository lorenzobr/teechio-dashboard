var config = null;

var segmentio = require('analytics-node'),
	analytics = null;

var httpClient = require('request');

var ConsoleController = module.exports = function(cfg) {
	config = cfg;
	analytics = new segmentio(config.analytics.write_key);
	return exports;
};

/**
 * [index description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.call = function(req, res) {
	var h = {
		uri: 'http://' + config.api.host + '/' + req.param('path'),
		method: req.method,
		headers: {
			'Teech-REST-API-Key': req.get('Teech-REST-API-Key'),
			'Teech-Application-Id': req.get('Teech-Application-Id')
		}
	};

	if(h.method == 'POST' || h.method == 'PUT') {
		h['json'] = req.body;
		h.headers['Content-Type'] = 'application/json';
	}

	analytics.track({
		userId: 'user-' + req.session.user.id,
		event: 'console:request',
		properties: {
			email: req.session.user.email,
			endpoint: h.uri,
			method: h.method,
			ip: req.session['ip'] 
		}
	});

	httpClient(h, function(error, response, body) {
		var status = 'HTTP/1.1 ' + response.statusCode + ' ';

		switch(response.statusCode) {
			case 200:
				status += 'OK';
				break;
			case 304:
				status += 'NOT MODIFIED';
				break;
			case 400:
				status += 'BAD REQUEST';
				break;
			case 401:
				status += 'UNAUTHORIZED';
				break;
			case 404:
				status += 'NOT FOUND';
				break;
			case 500:
				status += 'INTERNAL ERROR';
				break;
		}
		try {
			var r = {
				headers: {
					status: status,
					'Content-Length': response.headers['content-length'],
					'Content-Type': response.headers['content-type'],
					date: response.headers['date']
				},
				body: (('GET' == h.method) || ('DELETE' == h.method)) 
					? JSON.parse(body) : body
			};
		} catch(e) {
			var r = {
				headers: {
					status: status,
					'Content-Length': response.headers['content-length'],
					'Content-Type': response.headers['content-type'],
					date: response.headers['date']
				},
				body: body
			};
		}
		res.json(response.statusCode, r);
	});
};

/**
 * [upload description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.upload = function(req, res) {
 	var data = new Buffer('');
  	req.on('data', function(chunk) {
  		data = Buffer.concat([data, chunk]);
  	});
  	req.on('end', function() {
    	req.rawBody = data;

		var h = {
			uri: 'http://' + config.api.host + '/files/' + req.param('name'),
			method: 'POST',
			headers: {
				'Teech-REST-API-Key': req.get('Teech-REST-API-Key'),
				'Teech-Application-Id': req.get('Teech-Application-Id')
			},
			body: data
		};
		httpClient(h, function(error, response, body) {
			res.json(response.statusCode, JSON.parse(body));
		});
  	});
};