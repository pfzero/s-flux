
import debug = require('debug');
import Promise = require('bluebird');
import request = require('superagent');
import module = constants;
const blueprintActionDebug = debug('app:flux:actions:BlueprintAction');
const BlueprintService = require('./BlueprintService');

import {IResourceOptions, IServiceMethod, IApiService, IBlueprintActions, IBlueprintServices} from './types';

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
class BlueprintAction implements IBlueprintActions {

    private apiService: IBlueprintServices
    private resourceName: string

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
    constructor(opts: IResourceOptions) {

        if (opts.resourceName === undefined) {
            throw new TypeError('given resourceName is requierd and must identify a resource on your server api. (e.g. users)');
        }

        this.resourceName = opts.resourceName;

        // private apiService
        this.apiService = opts.apiService;
        if (typeof this.resourceName !== 'function') {
            this.apiService = new BlueprintService({ resourceName: this.resourceName });
        }
    }

    private callService(action: string, service: request.SuperAgentStatic, ...data: Array<any>): Promise<any> {
        return this.getApiService()[action](service, ...data);
    }

    protected getResourceName(): string {
        return this.resourceName;
    }

    protected getApiService(): IBlueprintServices {
        return this.apiService;
    }

    BaseAction(action: string, ctx: any, ...givenInput: Array<any>) {
        let actionConstants = constants.getActionConstants(this.getResourceName(), action);

        blueprintActionDebug('dispatching...', actionConstants.base);
        ctx.dispatch(actionConstants.base, { givenInput });

        return this.callService(action, ctx.getBaseRequest(), ...givenInput).then(res => {
            blueprintActionDebug('dispatching...', actionConstants.success);
            ctx.dispatch(actionConstants.success, {
                givenInput: givenInput,
                res: res
            });
        }).catch(err => {
            blueprintActionDebug('dispatching...', actionConstants.error);
            ctx.dispatch(actionConstants.error, {
                givenInput: givenInput,
                error: err
            });
            // bubble up
            return Promise.reject(err);
        });
    }

    Create(ctx: any, resourceData: any, query?: any) {
        return this.BaseAction('Create', ctx, resourceData, query);
    }
    
    // alias Update
    Batch(ctx: any, resourceId: string, resourceData: any, query: any) {
        return this.Update(ctx, resourceId, resourceData, query);
    }
    
    Update(ctx: any, resourceId: string, resourceData: any, query: any) {
        return this.BaseAction('Update', ctx, resourceId, resourceData, query);
    }
    GetById(ctx: any, resourceId: string, query?: string) {
        return this.BaseAction('GetById', ctx, resourceId, query);
    }
    GetBy(ctx: any, fields?: any, query?: any) {
        return this.BaseAction('GetBy', ctx, fields, query);
    }
    Delete(ctx: any, resourceId: string, query?: string) {
        return this.BaseAction('Delete', ctx, resourceId, query);
    }
    Find(ctx: any, query: any) {
        return this.BaseAction('Find', ctx, query);
    }
    AddTo(ctx: any, resourceId: string, subResourceName: string, subResourceData: any, query: any) {
        return this.BaseAction('AddTo', ctx, resourceId, subResourceName, subResourceData, query);
    }
    Link(ctx: any, resourceId: string, subResourceName: string, subResourceId: string, query: any) {
        return this.BaseAction('Link', ctx, resourceId, subResourceName, subResourceId, query);
    }
    UnLink(ctx: any, resourceId: string, subResourceName: string, subResourceId: string, query: any) {
        return this.BaseAction('UnLink', ctx, resourceId, subResourceName, subResourceId, query);
    }
}

export default BlueprintAction;