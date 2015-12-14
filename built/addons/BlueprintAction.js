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
var debug = require('debug');
var Promise = require('bluebird');
var constants = require('../constants/index');
var BlueprintService_1 = require('./BlueprintService');
var blueprintActionDebug = debug('app:flux:actions:BlueprintAction');
var BlueprintAction = (function () {
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
        if (opts.resourceName === undefined) {
            throw new TypeError('given resourceName is requierd and must identify a resource on your server api. (e.g. users)');
        }
        this.resourceName = opts.resourceName;
        // private apiService
        this.apiService = opts.apiService;
        if (typeof this.apiService !== 'object') {
            this.apiService = new BlueprintService_1.BlueprintService({ resourceName: this.resourceName });
        }
    }
    BlueprintAction.prototype.callService = function (action, service) {
        var data = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            data[_i - 2] = arguments[_i];
        }
        return (_a = this.getApiService())[action].apply(_a, [service].concat(data));
        var _a;
    };
    BlueprintAction.prototype.getResourceName = function () {
        return this.resourceName;
    };
    BlueprintAction.prototype.getApiService = function () {
        return this.apiService;
    };
    BlueprintAction.prototype.BaseAction = function (action, ctx) {
        var givenInput = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            givenInput[_i - 2] = arguments[_i];
        }
        var actionConstants = constants.getActionConstants(this.getResourceName(), action);
        blueprintActionDebug('dispatching...', actionConstants.base);
        ctx.dispatch(actionConstants.base, {
            givenInput: givenInput
        });
        return this.callService.apply(this, [action, ctx.getBaseRequest()].concat(givenInput)).then(function (res) {
            blueprintActionDebug('dispatching...', actionConstants.success);
            ctx.dispatch(actionConstants.success, {
                givenInput: givenInput,
                res: res
            });
        }).catch(function (err) {
            blueprintActionDebug('dispatching...', actionConstants.error);
            ctx.dispatch(actionConstants.error, {
                givenInput: givenInput,
                error: err
            });
            // bubble up
            return Promise.reject(err);
        });
    };
    BlueprintAction.prototype.Create = function (ctx, resourceData, query) {
        return this.BaseAction('Create', ctx, resourceData, query);
    };
    BlueprintAction.prototype.GetById = function (ctx, resourceId, query) {
        return this.BaseAction('GetById', ctx, resourceId, query);
    };
    BlueprintAction.prototype.GetBy = function (ctx, fields, query) {
        return this.BaseAction('GetBy', ctx, fields, query);
    };
    // alias Update
    BlueprintAction.prototype.Batch = function (ctx, resourceId, resourceData, query) {
        return this.Update(ctx, resourceId, resourceData, query);
    };
    BlueprintAction.prototype.Update = function (ctx, resourceId, resourceData, query) {
        return this.BaseAction('Update', ctx, resourceId, resourceData, query);
    };
    BlueprintAction.prototype.Delete = function (ctx, resourceId, query) {
        return this.BaseAction('Delete', ctx, resourceId, query);
    };
    BlueprintAction.prototype.Find = function (ctx, query) {
        return this.BaseAction('Find', ctx, query);
    };
    BlueprintAction.prototype.AddTo = function (ctx, resourceId, subResourceName, subResourceData, query) {
        return this.BaseAction('AddTo', ctx, resourceId, subResourceName, subResourceData, query);
    };
    BlueprintAction.prototype.Link = function (ctx, resourceId, subResourceName, subResourceId, query) {
        return this.BaseAction('Link', ctx, resourceId, subResourceName, subResourceId, query);
    };
    BlueprintAction.prototype.UnLink = function (ctx, resourceId, subResourceName, subResourceId, query) {
        return this.BaseAction('UnLink', ctx, resourceId, subResourceName, subResourceId, query);
    };
    return BlueprintAction;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BlueprintAction;
//# sourceMappingURL=BlueprintAction.js.map