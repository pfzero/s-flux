'use strict';

var superagent = require('superagent'),
  debug = require('debug')("app:services:Rest");


var API_ROOT,
  TIMEOUT = 10000;

var Rest = {

  /**
   * this is the base request used to communicate with the API server
   * creates a superagent preconfigured request
   * @param  {String} method   The http verb; One of (GET, POST, PUT, DELETE, PATCH, OPTIONS)
   * @param  {String} endpoint The endpoint used to send the request
   * @return {Request}         The request object from superagent package
   */
  request: function(context, method, endpoint) {

    if (undefined === API_ROOT) {
      throw new Error("You must provide the API_ROOT before using any flux actions. You must pass it in config property when creating the dispatcher");
    }

    if (endpoint.indexOf(API_ROOT) === -1) {
      endpoint = API_ROOT + endpoint;
    }

    var r = superagent(method, endpoint)
      .timeout(TIMEOUT)
      .type('json')
      .accept('json'),
      serverReq = context.req;

    if (serverReq) {
      r.set('Cookie', server.get('Cookie'));
    }

    return r;
  },

  setConfig: function(config) {
    API_ROOT = config.API_ROOT;
    if (config.TIMEOUT) {
      TIMEOUT = config.TIMEOUT;
    }
  }
};

module.exports = Rest;