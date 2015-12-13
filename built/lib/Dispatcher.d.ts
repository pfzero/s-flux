import DispatcherContext from './DispatcherContext';
import shapes = require("../appTypes/shapes");
import Rest from '../addons/Rest';
export default class Dispatcher {
    stores: shapes.IStoreMap;
    actions: shapes.IActionMap;
    handlers: shapes.IActionDispatcherMap;
    rest: typeof Rest;
    /**
     * @class Dispatcher
     * @param {Object} options Dispatcher options
     * @param {Array} options.stores Array of stores to register
     * @constructor
     */
    constructor(options: shapes.IDispatcherOptions);
    createContext(context?: any): DispatcherContext;
    /**
     * Registers a store so that it can handle actions.
     * @method registerStore
     * @static
     * @param {Object} store A store class to be registered. The store should have a static
     *      `name` property so that it can be loaded later.
     * @throws {Error} if store is invalid
     * @throws {Error} if store is already registered
     */
    registerStore(store: shapes.IStoreClass): void;
    /**
     * Method to discover if a storeName has been registered
     * @method isRegistered
     * @static
     * @param {Object|String} store The store to check
     * @returns {boolean}
     */
    isRegistered(store: shapes.IStoreClass): boolean;
    /**
     * Gets a name from a store
     * @method getStoreName
     * @static
     * @param {String|Object} store The store name or class from which to extract the name
     * @returns {String}
     */
    getStoreName(store: shapes.IStoreClass): string;
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
    registerHandler(action: string, storeName: string, handler: shapes.IStoreDispatchFn): number;
    /**
    * Registers a group of actions (e.g. UserActions)
    * @param  {String} groupName                   Group's Name (e.g. UserActons)
    * @param  {Constructor} actionsCreatorInstance The class to be instantiated
    */
    registerActions(groupName: string, actionsCreatorInstance: shapes.IActionClass | any, opts?: shapes.IResourceOptions): void;
}
