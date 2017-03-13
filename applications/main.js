var Bot = require(require('path').join('..','..','core','bot.js'));

/**
 * Dropbox Bot
 * @class Dropbox
 * @augments Bot
 * @param {string} name
 * @param {string} folder
 * @param {Dropbox~Configuration[]} allConfigurations
 * @constructor
 */
function Dropbox(name, folder, allConfigurations){
  Bot.call(this, name, folder, allConfigurations);

  this.defaultValues.hostname = 'api.dropboxapi.com';
  
  this.defaultValues.httpModule = 'https';
  this.defaultValues.pathPrefix = '2';
  this.defaultValues.port = 443;
  
  this.defaultValues.defaultRemainingRequest = 50;
  this.defaultValues.defaultRemainingTime = 60*1;
}

Dropbox.prototype = new Bot();
Dropbox.prototype.constructor = Dropbox;

/**
 * Prepare and complete parameters for request
 * @param {Bot~doRequestParameters} parameters
 * @param {Bot~requestCallback|*} callback
 */
Dropbox.prototype.prepareRequest = function(parameters, callback) {
  this.addQueryAccessToken(parameters);
  this.doRequest(parameters, callback);
};

/**
 * API me
 * @param {Dropbox~requestCallback} callback
 */
Dropbox.prototype.me = function(callback) {
  var params = {
    method: 'POST',
    path: 'users/get_current_account',
    output: {
      model: 'User'
    }
  };

  this.prepareRequest(params, callback);
};

Dropbox.prototype.listFolder = function(args, callback) {
  var params = {
    method: 'POST',
    path: 'files/list_folder',
    body: JSON.stringify({path: args[0]}),
    headers:{
      'Content-Type': 'application/json'
    }
  };

  this.prepareRequest(params, callback);
};

Dropbox.prototype.downloadFile = function(args, callback) {
  var params = {
    hostname: 'content.dropboxapi.com',
    method: 'POST',
    path: 'files/download',
    outputFilepath: '/test.mov',
    /*output: {
      model: 'User'
    }*/
    headers:{
      'Dropbox-API-Arg': JSON.stringify({path: args[0]})
    }
  };

  this.prepareRequest(params, callback);
};

/**
 * Add access token to query parameters
 * @param {Bot~doRequestParameters} parameters
 */
Dropbox.prototype.addQueryAccessToken = function(parameters) {
  if(parameters.headers === undefined) {
    parameters.headers = {};
  }

  parameters.headers.Authorization = 'Bearer ' + this.accessToken.access_token;
};

/**
 * Get remaining requests from result 
 * @param {Request~Response} resultFromRequest
 * @return {Number}
 */
Dropbox.prototype.getRemainingRequestsFromResult = function(resultFromRequest) {
  return this.defaultValues.defaultRemainingRequest - 1;
};

/**
 * Get url for Access Token when you have to authorize an application
 * @param {string} scopes
 * @param {*} callback
 */
Dropbox.prototype.getAccessTokenUrl = function(scopes, callback) {
  var url = 'https://www.dropbox.com/oauth2/authorize?'
    + 'response_type=code&'
    + 'redirect_uri=' + this.currentConfiguration.redirect_uri + '&'
    + 'client_id=' + this.currentConfiguration.app_key + '&';

  callback(url);
};

/**
 * Extract response in data for Access Token
 * @param {Object} req request from local node server
 * @return {*} code or something from response
 */
Dropbox.prototype.extractResponseDataForAccessToken = function(req) {
  var query = require('url').parse(req.url, true).query;

  if(query.code === undefined) {
    return null;
  }

  return query.code;
};

/**
 * Request Access Token after getting code
 * @param {string} responseData
 * @param {Bot~requestAccessTokenCallback} callback
 */
Dropbox.prototype.requestAccessToken = function(responseData, callback) {
  var uri = 'grant_type=authorization_code&'
    + 'client_id=' + this.currentConfiguration.app_key + '&'
    + 'client_secret=' + this.currentConfiguration.app_secret + '&'
    + 'redirect_uri=' + encodeURIComponent(this.currentConfiguration.redirect_uri) + '&'
    + 'code=' + responseData;

  var params = {
    method: 'POST',
    path: 'oauth2/token?' + uri,
    pathPrefix: ''
  };

  this.request(params, function(error, result){
    if(error) {
      callback(error, null);
      return;
    }

    if(result.statusCode === 200) {
      callback(null, JSON.parse(result.data));
    }
    else {
      callback(JSON.parse(result.data), null);
    }
  });
};

/**
 * getAccessTokenFromAccessTokenData
 * @param {*} accessTokenData
 * @return {*}
 */
Dropbox.prototype.getAccessTokenFromAccessTokenData = function(accessTokenData) {
  return accessTokenData.access_token;
};

/**
 * getTypeAccessTokenFromAccessTokenData
 * @param {*} accessTokenData
 * @return {*}
 */
Dropbox.prototype.getTypeAccessTokenFromAccessTokenData = function(accessTokenData) {
  return accessTokenData.token_type;
};

/**
 * getUserForNewAccessToken
 * @param {*} formatAccessToken
 * @param {Bot~getUserForNewAccessTokenCallback} callback
 */
Dropbox.prototype.getUserForNewAccessToken = function(formatAccessToken, callback) {
  var that = this;

  that.setCurrentAccessToken(formatAccessToken.access_token);
  that.verifyAccessTokenScopesBeforeCall = false;
  this.me(function(err, user){
    that.verifyAccessTokenScopesBeforeCall = true;
    if(err) {
      callback(err, null);
    }
    else {
      var username = (user !== null) ? user.getSurname() : null;
      callback(null, username);
    }
  });
};

Dropbox.prototype.extractDataFromRequest = function(data) {
    return data;
};

module.exports = Dropbox;

/**
 * Dropbox Configuration
 * @typedef {Object} Dropbox~Configuration
 * @property {string} name
 * @property {string} app_key
 * @property {string} app_secret
 * @property {string} access_token
 * @property {string} redirect_uri
 * @property {string} scopes
 */
/**
 * Request callback
 * @callback Dropbox~requestCallback
 * @param {Error|string|null} error - Error
 * @param {*} data
 */
