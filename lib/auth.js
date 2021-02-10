var Q       = require('q');

module.exports = function(client) {

  return {
    authenticate: function() {
      return client.execute('/services/oauth2/token', {
        username: client.options.username,
        password: client.options.password
      }).then(function(results) {
        // Set the apiKey directly on the client for all
        // future calls
        client.access_token = results.access_token;
        client.version = results.version || 4;

        return Q.fcall(function() { return results; });
      });
    }
  };
};
