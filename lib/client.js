var request       = require('request');
var util          = require('util');
var Q             = require('q');
var errors        = require('./errors');
var Hoek          = require('hoek');


var ROOT_API_URL  = "https://pi.pardot.com/api";
var ROOT_AUTH_URL = "https://login.salesforce.com";

function Client(options) {
  options.format = 'json';
  this.options = options;
}

Client.prototype.execute = function(path, params) {
  var self = this;

  params = params || {};

  // Set the authentication credentials for every request
  params.access_token  = self.access_token;
  params.format   = 'json';

  return Q.promise(function(resolve, reject) {

    // Check that we have an accessToken set if this is not a login attempt.
    Hoek.assert(params.access_token || (params.username && params.password), 'Client must be authenticated');

    var apiPath;
    var headers = {};
    var options;
    if (params.access_token) {
      apiPath = util.format('%s%s', ROOT_API_URL, path);
      headers = {
        'Authorization': 'Bearer '+params.access_token,
        'Pardot-Business-Unit-Id': self.options.businessUnitId
      };

      options = {
        url: apiPath,
        form: params,
        headers: headers
      };
    } else {
      apiPath = util.format('%s%s', ROOT_AUTH_URL, path);
      params.client_id = self.options.clientId;
      params.client_secret = self.options.clientSecret;
      params.grant_type = 'password';

      options = {
        url: apiPath,
        form: params
      };
    }

    self.log('Sending request to ' + apiPath);
    self.log(params);

    request.post(
      options,
      function(err, response, body) {
        if(err) {
          self.log(err);
          return reject(err);
        }

        var payload = body ? JSON.parse(body) : null;

        // Delete methods don't return any content
        if(payload)
        {
          self.log("Received Response");
          self.log(payload);

          if(params.access_token && payload['@attributes'].stat !== 'ok') {
            return reject(errors.byCode[payload['@attributes'].err_code]);
          }
          return resolve(payload);
        }

        return resolve(true);
      }
    );
  });
};


Client.prototype.log = function(message) {
  if(this.options.debug) {
    console.log(message);
  }
};

module.exports = Client;
