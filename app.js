/**
   Copyright 2012 PayPal.
  
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
  
        http://www.apache.org/licenses/LICENSE-2.0
  
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

/**
 * Client details
 */

var CLIENT_ID           = 'YOUR_ID';
var CLIENT_SECRET       = 'YOUR_SECRET';
var RETURN_URL          = 'http://localhost:3000/authz';
var RETURN_URL_LOGOUT   = 'http://localhost:3000/';
var REQUEST_SCOPE       = 'openid profile';

/*
 * OpenID Connect Endpoints
 */
var AUTHORIZATION_ENDPOINT  = 'https://www.paypal.com/webapps/auth/protocol/openidconnect/v1/authorize';
var TOKENSERVICE_ENDPOINT   = 'https://www.paypal.com/webapps/auth/protocol/openidconnect/v1/tokenservice'
var PROFILE_ENDPOINT        = 'https://www.paypal.com/webapps/auth/protocol/openidconnect/v1/userinfo';
var VALIDATION_ENDPOINT     = 'https://www.paypal.com/webapps/auth/protocol/openidconnect/v1/checkid';
var LOGOUT_ENDPOINT         = 'https://www.paypal.com/webapps/auth/protocol/openidconnect/v1/endsession';

/**
 * OpenID Connect tokens
 */
var authorization_token;
var access_token;
var id_token;
var refresh_token;

/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , https = require('https')
  , path = require('path')
  , url = require('url')
  , request = require('request')
  , querystring = require('querystring');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

/**
 * Configure the application's routing
 */

app.get('/', function(req, res) {
  res.render('index');
});

/**
 * Routes that get used to do node.js function calls
 */

app.get('/auth', function(req, res) {
  var authURL = AUTHORIZATION_ENDPOINT + '?client_id=' + CLIENT_ID + '&response_type=code&scope=' + escape(REQUEST_SCOPE) + '&redirect_uri=' + RETURN_URL + '&nonce=1';
  res.redirect(authURL);
});

app.get('/authz', function(req, res) {  
  authorization_token = req.query.code;
  authorize(res, function(status, body) {
    console.log('status: ' + status);
  });
});

app.get('/validate', function(req, res) {
  validateToken(res, function(status, body) {
    console.log('status: ' + status);
    res.end('Status: ' + status + '\nBody: ' + body);
  });
});

app.get('/refresh', function(req, res) {
  refreshToken(res, function(status, body) {
    console.log('status: ' + status);
    res.end('Status: ' + status + '\nBody: ' + body);
  });
});

app.get('/logout', function(req, res) {
  logout(res, function(status, body) {
    console.log('status: ' + status);
    res.redirect('/');
  });
});

/**
 * The OpenID Connect funtions
 */

function authorize(res, callback) {
	var data = querystring.stringify({
    'client_id' : CLIENT_ID,
    'client_secret' : CLIENT_SECRET,
    'grant_type' : 'authorization_code',
    'code' : authorization_token,
    'redirect_uri' : RETURN_URL
  });
  
  post(TOKENSERVICE_ENDPOINT, data, function(status, body) {
    callback(status, body);
    if(status == 200) {
	  var response = JSON.parse(body);
	  
	  // get the tokens from the received json object
	  access_token = response.access_token;
	  id_token = response.id_token;
      refresh_token = response.refresh_token;
      
      getProfile(res, function(status, body) {
        console.log('status: ' + status);
        
        var response = JSON.parse(body);
        res.render('authorized', {name : response.name}); 
      });
    } else {
	  res.end('Error when trying to receive token :(');
    }
  });
}

/**
 * Returns the user's profile
 */
function getProfile(res, callback) {
  var data = querystring.stringify({
    'schema' : 'openid',
	'access_token' : access_token
  });

  post(PROFILE_ENDPOINT, data, function(status, body) {
    callback(status, body);
  }); 
}

/**
 * Checks if the current token is still valid
 */
function validateToken(res, callback) {
  var data = querystring.stringify({
	'access_token' : id_token
  });

  post(VALIDATION_ENDPOINT, data, function(status, body) {
    callback(status, body);
    res.end(body);
  }); 
}

/**
 * Refreshs the current token
 */
function refreshToken(res, callback) {
  var data = querystring.stringify({
    'client_id' : CLIENT_ID,
    'client_secret' : CLIENT_SECRET,
    'grant_type' : 'refresh_token',
    'refresh_token' : refresh_token,
    'scope' : REQUEST_SCOPE
  });

  post(TOKENSERVICE_ENDPOINT, data, function(status, body) {
    callback(status, body);
    res.end(body);
  }); 
}

/**
 * Ends the current session
 */
function logout(res, callback) {
  var data = querystring.stringify({
  	'id_token' : id_token,
    'redirect_uri' : RETURN_URL_LOGOUT,
	'logout' : 'true',
	'state' : new Date().getTime()
  });

  get(LOGOUT_ENDPOINT, data, function(status, body) {
    callback(status, body);
  }); 
}

/**
 * This method is used as a wrapper for POSTs and provides a callback mechanism
 */
function post(url, data, callback) {
  request.post({uri:url, body:data, method:'POST', headers:{'Content-type':'application/x-www-form-urlencoded'}}, function (error, response, body) {
      callback(response.statusCode, body);
  });
}

/**
 * This method is used as a wrapper for GETs and provides a callback mechanism
 */
function get(url, data, callback) {
  var requestUrl = url + '?' + data;
  request.get(requestUrl, function(error, response, body) {
      callback(response.statusCode, body);
  });	
}

/**
 * Start the application
 */
 
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
