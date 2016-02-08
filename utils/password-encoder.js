/**
 * Nodejs implementation of Symfony 2 password encoder
 * 
 * [encoder description]
 * @type {Object}
 */
var crypto = require('crypto');

/*
    $this->checkPasswordLength($raw);

    if (!in_array($this->algorithm, hash_algos(), true)) {
        throw new \LogicException(sprintf('The algorithm "%s" is not supported.', $this->algorithm));
    }

    $salted = $this->mergePasswordAndSalt($raw, $salt);
    $digest = hash($this->algorithm, $salted, true);

    // "stretch" hash
    for ($i = 1; $i < $this->iterations; $i++) {
        $digest = hash($this->algorithm, $digest.$salted, true);
    }

    return $this->encodeHashAsBase64 ? base64_encode($digest) : bin2hex($digest);
 */

/*
   if (empty($salt)) {
        return $password;
    }

    if (false !== strrpos($salt, '{') || false !== strrpos($salt, '}')) {
        throw new \InvalidArgumentException('Cannot use { or } in salt.');
    }

    return $password.'{'.$salt.'}';
 */

var EncoderModule = {
	mergePasswordAndSalt: function(password, salt) {
		if(null == salt)
			return password;

		if(-1 !== salt.indexOf('{') || -1 !== salt.indexOf('}')) {
			return null;
		}
		return password + '{' + salt + '}';
	},

	generateSalt: function() {
		var hash = crypto.createHash('md5');
		var salt = EncoderModule.uniqid(null, true);
		var digest = hash.update(salt);
		return hash.digest('hex');
	},

	/**
	 * [uniqid description]
	 * @param  {[type]} prefix       [description]
	 * @param  {[type]} more_entropy [description]
	 * @return {[type]} 
	 * @see https://github.com/kvz/phpjs/blob/master/functions/misc/uniqid.js
	 */
	uniqid: function(prefix, more_entropy) {
  		// +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	  	// +   revised by: Kankrelune (http://www.webfaktory.info/)
	  	// %   note 1: Uses an internal counter (in php_js global) to avoid collision
	  	// *   example 1: uniqid();
	  	// *   returns 1: 'a30285b160c14'
	  	// *   example 2: uniqid('foo');
	  	// *   returns 2: 'fooa30285b1cd361'
	  	// *   example 3: uniqid('bar', true);
	  	// *   returns 3: 'bara20285b23dfd1.31879087'
  		if (typeof prefix === 'undefined' || null === prefix) {
    		prefix = "";
  		}

  		var retId;
  		var formatSeed = function (seed, reqWidth) {
    		seed = parseInt(seed, 10).toString(16); // to hex str
    		if (reqWidth < seed.length) { // so long we split
      			return seed.slice(seed.length - reqWidth);
    		}
    		if (reqWidth > seed.length) { // so short we pad
      			return Array(1 + (reqWidth - seed.length)).join('0') + seed;
    		}
    		return seed;
  		};

		// BEGIN REDUNDANT
		if (!this.php_js) {
			this.php_js = {};
		}
	  	// END REDUNDANT
	  	if (!this.php_js.uniqidSeed) { // init seed with big random int
	    	this.php_js.uniqidSeed = Math.floor(Math.random() * 0x75bcd15);
	  	}
	  	this.php_js.uniqidSeed++;

	  	retId = prefix; // start with prefix, add current milliseconds hex string
	  	retId += formatSeed(parseInt(new Date().getTime() / 1000, 10), 8);
	  	retId += formatSeed(this.php_js.uniqidSeed, 5); // add seed hex string
	  	if (more_entropy) {
	    	// for more entropy we add a float lower to 10
	    	retId += (Math.random() * 10).toFixed(8).toString();
	  	}
		return retId;
	}
};

exports.encodePassword = function(raw, salt) {
	var hash = crypto.createHash('sha1');
	var salted = EncoderModule.mergePasswordAndSalt(raw, salt);
	var digest = hash.update(salted);
	return hash.digest('hex');
};

exports.mergePasswordAndSalt = EncoderModule.mergePasswordAndSalt;
exports.generateSalt = EncoderModule.generateSalt;
exports.uniqid = EncoderModule.uniqid;