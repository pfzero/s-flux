import shapes = require('../appTypes/shapes');
import components = require('../appTypes/components');
import Dispatcher from './Dispatcher';
import { Action } from './Action';
export default class DispatcherContext {
    private dispatcher;
    storeInstances: shapes.IStoreInstanceMap;
    currentAction: Action;
    dispatcherInterface: shapes.IDispatcherInterface;
    /**
     * @class Dispatcher
     * @param {Object} context The context to be used for store instances
     * @constructor
     */
    constructor(dispatcher: Dispatcher, context?: any);
    /**
      * Returns a single store instance and creates one if it doesn't already exist
      * @method getStore
      * @param {String} storeName The name of the instance
      * @returns {Object} The store instance
      * @throws {Error} if store is not registered
      */
    getStore(storeName: string): components.Store;
    /**
     * Dispatches a new action or queues it up if one is already in progress
     * @method dispatch
     * @param {String} actionName Name of the action to be dispatched
     * @param {Object} payload Parameters to describe the action
     * @throws {Error} if store has handler registered that does not exist
     */
    dispatch(actionName: string, payload: shapes.IActionPayload): void;
    /**
     * Returns a raw data object representation of the current state of the
     * dispatcher and all store instances. If the store implements a shouldDehdyrate
     * function, then it will be called and only dehydrate if the method returns `true`
     * @method dehydrate
     * @returns {Object} dehydrated dispatcher data
     */
    dehydrate(): any;
    /**
     * Takes a raw data object and rehydrates the dispatcher and store instances
     * @method rehydrate
     * @param {Object} dispatcherState raw state typically retrieved from `dehydrate`
     *      method
     */
    rehydrate(dispatcherState: any): void;
    /**
     * Waits until all stores have finished handling an action and then calls
     * the callback
     * @method waitFor
     * @param {String|String[]} stores An array of stores as strings to wait for
     * @param {Function} callback Called after all stores have completed handling their actions
     * @throws {Error} if there is no action dispatching
     */
    waitFor(stores: string[], callback: Function): void;
    getActions(groupName: string): shapes.IActions;
    getBaseRequest(): shapes.IRestMethod;
}
