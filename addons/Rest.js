'use strict';

var superagent = require('superagent'),
  debug = require('debug')("app:services:Rest");

var Rest = {

  config: {
    API_URL: "",
    TIMEOUT: 10000
  },

  /**
   * this is the base request used to communicate with the API server
   * creates a superagent preconfigured request
   * @param  {String} method   The http verb; One of (GET, POST, PUT, DELETE, PATCH, OPTIONS)
   * @param  {String} endpoint The endpoint used to send the request
   * @return {Request}         The request object from superagent package
   */
  request: function(context, method, endpoint) {

    var API_URL = Rest.config.API_URL,
        TIMEOUT = Rest.config.TIMEOUT;

    if ("" === API_URL) {
      throw new Error("You must provide the API_URL before using any flux actions. You must pass it in config property when creating the dispatcher");
    }

    if (endpoint.indexOf(API_URL) === -1) {
      endpoint = API_URL + endpoint;
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
    Rest.config = config;
  }
};

module.exports = Rest;