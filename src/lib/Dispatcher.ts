
import DispatcherContext from './DispatcherContext';

import components = require("../appTypes/components");
import shapes = require("../appTypes/shapes");

import Rest from '../addons/Rest';

let Action : any;
// let DispatcherContext : any;

const DEFAULT = 'default';

export default class Dispatcher {

    public stores: shapes.IStoreMap = {};

    public actions: shapes.IActionMap = {};

    public handlers: shapes.IActionDispatcherMap = {};

    public rest = Rest;
    
    /**
     * @class Dispatcher
     * @param {Object} options Dispatcher options
     * @param {Array} options.stores Array of stores to register
     * @constructor
     */
    constructor(options: shapes.IDispatcherOptions) {

        options.stores = options.stores || [];

        this.handlers[DEFAULT] = [];

        options.stores.forEach(store => {
            this.registerStore(store);
        }, this);
        
        // set configurations for request
        this.rest.setConfig(options.config);
    }

    createContext(context?: any) {
        return new DispatcherContext(this, context);
    }
    
    /**
     * Registers a store so that it can handle actions.
     * @method registerStore
     * @static
     * @param {Object} store A store class to be registered. The store should have a static
     *      `name` property so that it can be loaded later.
     * @throws {Error} if store is invalid
     * @throws {Error} if store is already registered
     */
    registerStore(store: shapes.IStoreClass): void {

        if ('function' !== typeof store) {
            throw new Error('registerStore requires a constructor as first parameter');
        }

        let storeName = this.getStoreName(store);

        if (!storeName) {
            throw new Error('Store is required to have a `storeName` property.');
        }

        if (this.stores[storeName]) {
            if (this.stores[storeName] === store) {
                // Store is already registered, nothing to do
                return;
            }
            throw new Error(`Store with name '${ storeName }' has already been registered.`);
        }

        this.stores[storeName] = store;

        if (store) {
            Object.keys(store.getHandlers()).forEach(action => {
                let handler = store.getHandlers()[action];
                this.registerHandler(action, storeName, handler);
            }, this);
        }
    }
    
    /**
     * Method to discover if a storeName has been registered
     * @method isRegistered
     * @static
     * @param {Object|String} store The store to check
     * @returns {boolean}
     */
    isRegistered(store: shapes.IStoreClass): boolean {
        const storeName = this.getStoreName(store),
            existingStore = this.stores[storeName];

        if (!existingStore) {
            return false;
        }

        if ('function' === typeof store) {
            if (store !== existingStore) {
                return false;
            }
        }

        return true;
    }
    
    /**
     * Gets a name from a store
     * @method getStoreName
     * @static
     * @param {String|Object} store The store name or class from which to extract the name
     * @returns {String}
     */
    getStoreName(store: shapes.IStoreClass): string {
        return store.storeName || store.name;
    }
    
    /**
     * Adds a handler function to be called for the given action
     * @method registerHandler
     * @private
     * @static
     * @param {String} action Name of the action
     * @param {String} name Name of the store that handles the action
     * @param {String|Function} handler The function or name of the method that handles the action
     * @returns {number}
     */
    registerHandler(action: string, storeName: string, handler: shapes.IStoreDispatchFn): number {

        this.handlers[action] = this.handlers[action] || [];

        this.handlers[action].push({
            storeName: storeName,
            handler: handler
        });

        return this.handlers[action].length;
    }
    
    /**
    * Registers a group of actions (e.g. UserActions)
    * @param  {String} groupName                   Group's Name (e.g. UserActons)
    * @param  {Constructor} actionsCreatorInstance The class to be instantiated
    */
    registerActions(groupName: string, actionsCreatorInstance: shapes.IActionClass | any, opts?: shapes.IResourceOptions) {

        let actionInstance : shapes.IActions;

        if (!groupName) {
            throw new TypeError('The name of the actions group is required! Set a name for these actions, for example: UserActions');
        }

        if (typeof actionsCreatorInstance === 'function') {
            actionInstance = new actionsCreatorInstance(opts);
        } else {
            actionInstance = actionsCreatorInstance;
        }
        
        if (this.actions[groupName]) {
            throw new Error(`Actions for ${ groupName } already registered!`);
        }
        this.actions[groupName] = actionInstance;
    }
}
