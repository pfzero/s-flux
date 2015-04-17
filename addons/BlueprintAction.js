import debug from "debug";

import BlueprintService from "./BlueprintService";

let blueprintActionDebug = debug("app:flux:actions:BlueprintAction");


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
let genericActionCreator = function(ctx, constants, apiFn, ...givenInput) {
    blueprintActionDebug("dispatching...", constants.base);

    ctx.dispatch(constants.base, {givenInput});

    return apiFn(ctx.getBaseRequest(), ...givenInput)
        .then(res => {
            ctx.dispatch(constants.success, {givenInput, res});
            ctx.dispatch(constants.complete);
        })
        .catch(err => {
            ctx.dispatch(constants.error, {givenInput, err});
            ctx.dispatch(constants.complete);
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
class BlueprintAction {

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
    constructor(opts = {}) {

        if(opts.resourceName === undefined) {
            throw new TypeError("given resourceName is requierd and must identify a resource on your server api. (e.g. users)");
        }

        // private resourceName
        let resourceName = opts.resourceName.toLowerCase();

        // private apiService
        let apiService = opts.apiService;

        if (undefined === apiService) {
            apiService = new BlueprintService({resourceName});
        }

        this.getResourceName = function() {
            return resourceName;
        }

        this.getApiService = function() {
            return apiService;
        }
    }

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
    getActionConstants(type = "") {

        let resourceName = this.getResourceName().toUpperCase(),
            upperType = type.toUpperCase();

        return {
            base: resourceName + "_" + upperType,
            success: resourceName + "_" + upperType + "_SUCCESS",
            error: resourceName + "_" + upperType + "_ERROR",
            complete: resourceName + "_" + upperType + "_COMPLETE"
        };
    }


    Create(ctx, resourceData) {
        let apiFn = this.getApiService().Create.bind(this.getApiService()),
            constants = this.getActionConstants("Create");

        return genericActionCreator(ctx, constants, apiFn, resourceData);
    }

    Update(ctx, resourceId, resourceData) {
        let apiFn = this.getApiService().Update.bind(this.getApiService()),
            constants = this.getActionConstants("Update");

        return genericActionCreator(ctx, constants, apiFn, resourceId, resourceData);
    }

    GetById(ctx, resourceId) {
        let apiFn = this.getApiService().GetById.bind(this.getApiService()),
            constants = this.getActionConstants("GetById");

        return genericActionCreator(ctx, constants, apiFn, resourceId);
    }

    GetBy(ctx, fields) {
        let apiFn = this.getApiService().GetBy.bind(this.getApiService()),
            constants = this.getActionConstants("GetBy");

        return genericActionCreator(ctx, constants, apiFn, fields);
    }

    Delete(ctx, resourceId) {
        let apiFn = this.getApiService().Delete.bind(this.getApiService()),
            constants = this.getActionConstants("Delete");

        return genericActionCreator(ctx, constants, apiFn, resourceId);
    }

    Find(ctx, query) {
        let apiFn = this.getApiService().Find.bind(this.getApiService()),
            constants = this.getActionConstants("Find");

        return genericActionCreator(ctx, constants, apiFn, query);
    }

    AddTo(ctx, resourceId, subResourceName, subResourceData) {
        let apiFn = this.getApiService().AddTo.bind(this.getApiService()),
            constants = this.getActionConstants("AddTo");

        return genericActionCreator(ctx, constants, apiFn, resourceId, subResourceName, subResourceData);
    }

    Link(ctx, resourceId, subResourceName, subResourceId) {
        let apiFn = this.getApiService().Link.bind(this.getApiService()),
            constants = this.getActionConstants("Link");

        return genericActionCreator(ctx, constants, apiFn, resourceId, subResourceName, subResourceId);
    }

    UnLink(ctx, resourceId, subResourceName, subResourceId) {
        let apiFn = this.getApiService().UnLink.bind(this.getApiService()),
            constants = this.getActionConstants("UnLink");

        return genericActionCreator(ctx, constants, apiFn, resourceId, subResourceName, subResourceId);
    }
}

export default BlueprintAction;

