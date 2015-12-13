import shapes = require('../appTypes/shapes');
export default class Rest {
    private static config;
    static setConfig(config: shapes.IRestConfig): void;
    /**
    * this is the base request used to communicate with the API server
    * creates a superagent preconfigured request
    * @param  {String} method   The http verb; One of (GET, POST, PUT, DELETE, PATCH, OPTIONS)
    * @param  {String} endpoint The endpoint used to send the request
    * @return {Request}         The request object from superagent package
    */
    static getRequest(environmentContext: any): shapes.IRestMethod;
}
