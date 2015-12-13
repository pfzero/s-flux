'use strict';

import superagent = require('superagent');
import shapes = require('../appTypes/shapes');


export default class Rest {
    private static config: shapes.IRestConfig;

    public static setConfig(config: shapes.IRestConfig) {
        this.config = config;
    }
 
    /**
    * this is the base request used to communicate with the API server
    * creates a superagent preconfigured request
    * @param  {String} method   The http verb; One of (GET, POST, PUT, DELETE, PATCH, OPTIONS)
    * @param  {String} endpoint The endpoint used to send the request
    * @return {Request}         The request object from superagent package
    */
    public static getRequest(environmentContext: any): shapes.IRestMethod {

        return (method: string, endpoint: string) => {
            const API_URL = Rest.config.API_URL,
                TIMEOUT = Rest.config.TIMEOUT;

            if ('' === API_URL) {
                throw new Error('You must provide the API_URL before using any flux actions. You must pass it in config property when creating the dispatcher');
            }

            if (endpoint.indexOf(API_URL) === -1) {
                endpoint = API_URL + endpoint;
            }

            const r = superagent(method, endpoint)
                .timeout(TIMEOUT)
                .type('json')
                .accept('json'),
                serverReq = environmentContext.req;

            if (typeof serverReq === 'object') {
                r.set('Cookie', serverReq.get('Cookie'));
            }

            r.get

            return r;
        }
    }
}