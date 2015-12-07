/**
 * Copyright 2014, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';
const Action = require('./Action');
const request = require('../addons/Rest').request;
const DEFAULT = 'default';
const debug = require('debug')('Dispatchr:DispatcherContext');
class DispatcherContext {
    /**
 * @class Dispatcher
 * @param {Object} context The context to be used for store instances
 * @constructor
 */
    constructor() {
        this.dispatcher = dispatcher;
        this.storeInstances = {};
        this.currentAction = null;
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
 * @param {String} name The name of the instance
 * @returns {Object} The store instance
 * @throws {Error} if store is not registered
 */
    getStore(name) {
        let storeName = this.dispatcher.getStoreName(name);
        if (!this.storeInstances[storeName]) {
            const Store = this.dispatcher.stores[storeName];
            if (!Store) {
                throw new Error(`Store ${ storeName } was not registered.`);
            }
            this.storeInstances[storeName] = new this.dispatcher.stores[storeName](this.dispatcherInterface);
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
    dispatch(actionName, payload) {
        if (!actionName) {
            throw new Error(`actionName parameter `${ actionName }` is invalid.`);
        }
        if (this.currentAction) {
            throw new Error(`Cannot call dispatch while another dispatch is executing. Attempted to execute '${ actionName }' but '${ this.currentAction.name }' is already executing.`);
        }
        const actionHandlers = this.dispatcher.handlers[actionName] || [], defaultHandlers = this.dispatcher.handlers[DEFAULT] || [];
        if (!actionHandlers.length && !defaultHandlers.length) {
            debug(`${ actionName } does not have any registered handlers`);
            return;
        }
        debug(`dispatching ${ actionName }`, payload);
        this.currentAction = new Action(actionName, payload);
        const self = this, allHandlers = actionHandlers.concat(defaultHandlers), handlerFns = {};
        try {
            allHandlers.forEach(store => {
                if (handlerFns[store.name]) {
                    // Don't call the default if the store has an explicit action handler
                    return;
                }
                const storeInstance = self.getStore(store.name);
                if ('function' === typeof store.handler) {
                    handlerFns[store.name] = store.handler.bind(storeInstance);
                } else {
                    if (!storeInstance[store.handler]) {
                        throw new Error(`${ store.name } does not have a method called ${ store.handler }`);
                    }
                    handlerFns[store.name] = storeInstance[store.handler].bind(storeInstance);
                }
            });
            this.currentAction.execute(handlerFns);
        } catch (e) {
            throw e;
        } finally {
            debug(`finished ${ actionName }`);
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
    dehydrate() {
        const self = this, stores = {};
        Object.keys(self.storeInstances).forEach(storeName => {
            const store = self.storeInstances[storeName];
            if (!store.dehydrate || store.shouldDehydrate && !store.shouldDehydrate()) {
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
    rehydrate(dispatcherState) {
        const self = this;
        if (dispatcherState.stores) {
            Object.keys(dispatcherState.stores).forEach(storeName => {
                const state = dispatcherState.stores[storeName], store = self.getStore(storeName);
                if (store.rehydrate) {
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
    waitFor(stores, callback) {
        if (!this.currentAction) {
            throw new Error('waitFor called even though there is no action dispatching');
        }
        this.currentAction.waitFor(stores, callback);
    }
    getActions(groupName) {
        if (this.dispatcher.actions[groupName]) {
            return this.dispatcher.actions[groupName];
        }
        throw new Error('No actions registered for the given group name: ', groupName);
    }
    getBaseRequest() {
        const ctx = this.dispatcherInterface.getContext() || {};
        return request.bind(null, ctx);
    }
}
module.exports = DispatcherContext;