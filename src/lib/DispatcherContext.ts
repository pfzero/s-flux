
'use strict';

import Rest from '../addons/Rest';
import debug = require('debug');

import shapes = require('../appTypes/shapes');
import components = require('../appTypes/components');

import Dispatcher from './Dispatcher';
import {Action} from './Action';

const DEFAULT = 'default';
const DispatcherContextDebug = debug('Dispatchr:DispatcherContext');

export default class DispatcherContext {

    public storeInstances: shapes.IStoreInstanceMap = {};
    public currentAction: Action = null;

    public dispatcherInterface: shapes.IDispatcherInterface
    
    
	/**
	 * @class Dispatcher
	 * @param {Object} context The context to be used for store instances
	 * @constructor
	 */
    constructor(private dispatcher: Dispatcher, context?: any) {
        this.dispatcherInterface = {
            getContext() {
                return context;
            },
            getStore: this.getStore.bind(this),
            waitFor: this.waitFor.bind(this)
        };

    }
    
    /**
	  * Returns a single store instance and creates one if it doesn't already exist
	  * @method getStore
	  * @param {String} storeName The name of the instance
	  * @returns {Object} The store instance
	  * @throws {Error} if store is not registered
	  */
    getStore(storeName: string) {

        if (!this.storeInstances[storeName]) {
            const Store = this.dispatcher.stores[storeName];
            if (!Store) {
                throw new Error(`Store ${ storeName } was not registered.`);
            }

            this.storeInstances[storeName] = new Store(this.dispatcherInterface);
        }

        return this.storeInstances[storeName];
    }
    
    /**
     * Dispatches a new action or queues it up if one is already in progress
     * @method dispatch
     * @param {String} actionName Name of the action to be dispatched
     * @param {Object} payload Parameters to describe the action
     * @throws {Error} if store has handler registered that does not exist
     */
    dispatch(actionName: string, payload: shapes.IActionPayload): void {

        if (!actionName) {
            throw new Error(`actionName parameter '${ actionName }' is invalid.`);
        }

        if (this.currentAction) {
            throw new Error(`Cannot call dispatch while another dispatch is executing. Attempted to execute '${ actionName }' but '${ this.currentAction.actionName }' is already executing.`);
        }

        const actionHandlers = this.dispatcher.handlers[actionName] || [],
            defaultHandlers = this.dispatcher.handlers[DEFAULT] || [];

        if (!actionHandlers.length && !defaultHandlers.length) {
            DispatcherContextDebug(`${ actionName } does not have any registered handlers`);
            return;
        }

        DispatcherContextDebug(`dispatching ${ actionName }`, payload);

        this.currentAction = new Action(actionName, payload);

        const allHandlers = actionHandlers.concat(defaultHandlers),
            handlerFns: shapes.IDispatcherMap = {};

        try {
            allHandlers.forEach(dispatchHandler => {

                if (handlerFns[dispatchHandler.storeName]) {
                    // Don't call the default if the store has an explicit action handler
                    return;
                }

                const storeInstance = this.getStore(dispatchHandler.storeName);

                handlerFns[dispatchHandler.storeName] = dispatchHandler.handler.bind(storeInstance);
            });

            this.currentAction.setStoreInstances(this.storeInstances);

            this.currentAction.execute(handlerFns);

        } catch (e) {
            throw e;
        } finally {
            DispatcherContextDebug(`finished ${ actionName }`);
            this.currentAction = null;
        }
    }
    
    /**
     * Returns a raw data object representation of the current state of the
     * dispatcher and all store instances. If the store implements a shouldDehdyrate
     * function, then it will be called and only dehydrate if the method returns `true`
     * @method dehydrate
     * @returns {Object} dehydrated dispatcher data
     */
    dehydrate(): any {

        const stores: { [storeName: string]: any } = {};

        Object.keys(this.storeInstances).forEach(storeName => {
            const store = this.storeInstances[storeName];

            if (typeof store.dehydrate !== 'function' || !store.shouldDehydrate()) {
                return;
            }

            stores[storeName] = store.dehydrate();
        });

        return { stores: stores };
    }

    /**
     * Takes a raw data object and rehydrates the dispatcher and store instances
     * @method rehydrate
     * @param {Object} dispatcherState raw state typically retrieved from `dehydrate`
     *      method
     */
    rehydrate(dispatcherState: any) {

        if (dispatcherState.stores) {
            Object.keys(dispatcherState.stores).forEach(storeName => {
                const state = dispatcherState.stores[storeName],
                    store = this.getStore(storeName);
                if (typeof store.rehydrate === 'function') {
                    store.rehydrate(state);
                }
            });
        }
    }

    /**
     * Waits until all stores have finished handling an action and then calls
     * the callback
     * @method waitFor
     * @param {String|String[]} stores An array of stores as strings to wait for
     * @param {Function} callback Called after all stores have completed handling their actions
     * @throws {Error} if there is no action dispatching
     */
    waitFor(stores: string[], callback: Function) {
        if (!this.currentAction) {
            throw new Error('waitFor called even though there is no action dispatching');
        }

        this.currentAction.waitFor(stores, callback);
    }

    getActions(groupName: string) {

        if (this.dispatcher.actions[groupName]) {
            return this.dispatcher.actions[groupName];
        }

        throw new Error(`No actions registered for the given group name: ${groupName}`);
    }

    getBaseRequest() {
        const ctx = this.dispatcherInterface.getContext() || {};

        return Rest.getRequest(ctx);
    }
}
