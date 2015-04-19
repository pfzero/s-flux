'use strict';

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

module.exports = function getActionConstants(resourceName, type) {

    var upperRsc = resourceName.toUpperCase(),
        upperType = type.toUpperCase();

    return {
        base: upperRsc + "_" + upperType,
        success: upperRsc + "_" + upperType + "_SUCCESS",
        error: upperRsc + "_" + upperType + "_ERROR",
        complete: upperRsc + "_" + upperType + "_COMPLETE"
    };
};