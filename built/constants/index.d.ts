import shapes = require('../appTypes/shapes');
export declare const errors: shapes.IAppErrorMap;
/**
    * getActionConstants returns the 4 type of actions that will
    * dispatch for every action
    * @example
    *     let constants = this.getActionConstants("create");
    *     console.log(constants);
    *     // will print:
    *     {
    *       base: "USERS_CREATE",
    *       success: "USERS_CREATE_SUCCESS",
    *       error: "USERS_CREATE_ERROR",
    *       complete: "USERS_CREATE_COMPLETE"
    *     }
    *
    * @param  {String} type Action type
    * @return {Object}
    */
export declare function getActionConstants(resourceName: string, type: string): {
    base: string;
    success: string;
    error: string;
    complete: string;
};
