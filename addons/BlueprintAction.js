var blueprintActionDebug = require('debug')("app:flux:actions:BlueprintAction"),
    getActionConstants = require('../constants/getActionConstants'),
    BlueprintService = require('./BlueprintService');


/**
 * genericActionCreator is the main function used
 * to create actions and dispatch to stores
 * @param  {Context} ctx       Fluxible Context
 * @param  {Object} constants  the constants object, it should contain
 *                             the properties: base, success, error
 *                             and complete
 *
 * @param  {Function} apiFn    the service function for communication
 *                             with server API
 *
 * @param  {Object} givenInput The received input from components
 * @return {Promise}           the resolved promise from service
 *                             function
 */
var genericActionCreator = function(ctx, constants, apiFn) {

    var givenInput = [],
        args;

    // drain arguments
    for (var i = 3, _l = arguments.length; i < _l; i++) {
        givenInput.push(arguments[i]);
    };

    args = givenInput.slice();
    args.unshift(ctx.getBaseRequest());

    blueprintActionDebug("dispatching...", constants.base);

    ctx.dispatch(constants.base, {
        givenInput: givenInput
    });

    return apiFn.apply(null, args)
        .then(function(res) {

            blueprintActionDebug("dispatching...", constants.success);

            ctx.dispatch(constants.success, {
                givenInput: givenInput,
                res: res
            });
        })
        .catch(function(err) {

            blueprintActionDebug("dispatching...", constants.error);

            ctx.dispatch(constants.error, {
                givenInput: givenInput,
                error: err
            });
        });
};

/**
 * BlueprintAction is the base class for creating
 * blueprint actions for a resource
 *
 * it automatically implements the following server methods:
 * Create, Update, Delete, GetById, Find, AddTo, Link, Unlink
 *
 * @class BlueprintAction
 * @abstract
 *
 * Note: This class should be extended, as it provides the base functionality for
 *       a blueprint server api
 *
 * @example
 *
 * Given the User collection with supported server rest methods:
 * GET      /restApi/users/:userId                                          -> get user by id
 * POST     /restApi/users                                                  -> create user
 * PUT      /restApi/users/:userId                                          -> update user (partial update)
 * PATCH    /restApi/users/:userId                                          -> same as PUT from above
 * GET      /restApi/users?where={someProperty: {contains: "someString"}}   -> search users
 * POST     /restApi/users/:userId/:subResource                             -> add some subResource to the users collection
 *                                                                             (e.g. add a book to user's list of books)
 * GET      /restApi/users/:userId/:subResource/:subResourceId              -> mark a relationship between user and a subResource
 *                                                                             (e.g. a book belongs to user's list)
 *
 * DELETE   /restApi/users/:userId/:subResource/:subResourceId              -> remove a subresource from user's list
 *                                                                             (e.g. remove a book from user's list of books)
 *
 * class UserAction extends BlueprintAction {
 *     constructor() {
 *         let resourceName = "users";
 *         super({});
 *     }
 * }
 *
 * let userActions = new UserAction();
 *
 * userActions.Create(ctx :FluxibleContext, data: Object): Promise -> returns a promise which, when resolved, the object is sent to server
 *                                                                      and the response is dispatched to stores
 *
 * userActions.GetById(ctx, userId): Promise
 * userActions.Update(ctx, userId): Promise
 * userActions.Delete(ctx, userId): Promise
 * userActions.Find(ctx, query): Promise
 * userActions.AddTo(ctx, userId, subResourceName, subResourceData): Promise
 * userActions.Link(ctx, userId, subResourceName, subResourceId): Promise
 * userActions.UnLink(ctx, userId, subResourceName, subResourceId): Promise
 */

/**
 * class constructor;
 * @constructor
 * @param  {Object} opts the constructor params
 *                       {
 *                           resourceName: {
 *                               type: "string",
 *                               required: true
 *                           },
 *
 *                           apiService: {
 *                               type: "BlueprintService",
 *                               defaultsTo: new BlueprintService({resourceName: resourceName})
 *                           }
 *                       }
 */
function BlueprintAction(opts) {
    opts = opts || {};

    if (opts.resourceName === undefined) {
        throw new TypeError("given resourceName is requierd and must identify a resource on your server api. (e.g. users)");
    }

    // private resourceName
    var resourceName = opts.resourceName.toLowerCase();

    // private apiService
    var apiService = opts.apiService;

    if (undefined === apiService) {
        apiService = new BlueprintService({
            resourceName: resourceName
        });
    }

    this.getResourceName = function() {
        return resourceName;
    }

    this.getApiService = function() {
        return apiService;
    }
}


BlueprintAction.prototype.BaseAction = function(action, ctx) {
    var apiFn = this.getApiService()[action].bind(this.getApiService()),
        constants = getActionConstants(this.getResourceName(), action),
        args = [ctx, constants, apiFn];

    // add the remaining arguments
    for (var i = 2, _l = arguments.length; i < _l; i++) {
        args.push(arguments[i]);
    };

    return genericActionCreator.apply(null, args);
}

BlueprintAction.prototype.Create = function(ctx, resourceData, query) {
    return this.BaseAction("Create", ctx, resourceData, query);
}

BlueprintAction.prototype.Update = function(ctx, resourceId, resourceData, query) {
    return this.BaseAction("Update", ctx, resourceId, resourceData, query);
}

BlueprintAction.prototype.GetById = function(ctx, resourceId, query) {
    return this.BaseAction("GetById", ctx, resourceId, query);
}

BlueprintAction.prototype.GetBy = function(ctx, fields, query) {
    return this.BaseAction("GetBy", ctx, fields, query);
}

BlueprintAction.prototype.Delete = function(ctx, resourceId, query) {
    return this.BaseAction("Delete", ctx, resourceId, query);
}

BlueprintAction.prototype.Find = function(ctx, query) {
    return this.BaseAction("Find", ctx, query);
}

BlueprintAction.prototype.AddTo = function(ctx, resourceId, subResourceName, subResourceData, query) {
    return this.BaseAction("AddTo", ctx, resourceId, subResourceName, subResourceData, query);
}

BlueprintAction.prototype.Link = function(ctx, resourceId, subResourceName, subResourceId, query) {
    return this.BaseAction("Link", ctx, resourceId, subResourceName, subResourceId, query);
}

BlueprintAction.prototype.UnLink = function(ctx, resourceId, subResourceName, subResourceId, query) {
    return this.BaseAction("UnLink", ctx, resourceId, subResourceName, subResourceId, query);
}

module.exports = BlueprintAction;