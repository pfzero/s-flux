'use strict';
const superagent = require('superagent'), debug = require('debug')('app:services:Rest');
const Rest = {
    config: {
        API_URL: '',
        TIMEOUT: 10000
    },
    /**
   * this is the base request used to communicate with the API server
   * creates a superagent preconfigured request
   * @param  {String} method   The http verb; One of (GET, POST, PUT, DELETE, PATCH, OPTIONS)
   * @param  {String} endpoint The endpoint used to send the request
   * @return {Request}         The request object from superagent package
   */
    request(context, method, endpoint) {
        const API_URL = Rest.config.API_URL, TIMEOUT = Rest.config.TIMEOUT;
        if ('' === API_URL) {
            throw new Error('You must provide the API_URL before using any flux actions. You must pass it in config property when creating the dispatcher');
        }
        if (endpoint.indexOf(API_URL) === -1) {
            endpoint = API_URL + endpoint;
        }
        const r = superagent(method, endpoint).timeout(TIMEOUT).type('json').accept('json'), serverReq = context.req;
        if (typeof serverReq === 'object') {
            r.set('Cookie', serverReq.get('Cookie'));
        }
        return r;
    },
    setConfig(config) {
        Rest.config = config;
    }
};
module.exports = Rest;