/**
 * Copyright 2014, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';
const debug = require('debug')('Dispatchr:Action');
class Action {
    constructor() {
        this.name = name;
        this.payload = payload;
        this._handlers = null;
        this._isExecuting = false;
        this._isCompleted = null;
    }
    /**
 * Gets a name from a store
 * @method getStoreName
 * @param {String|Object} store The store name or class from which to extract
 *      the name
 * @returns {String}
 */
    getStoreName(store) {
        if ('string' === typeof store) {
            return store;
        }
        return store.storeName;
    }
    /**
 * Executes all handlers for the action
 * @method execute
 * @param {Function[]} handlers A mapping of store names to handler function
 * @throws {Error} if action has already been executed
 */
    execute(handlers) {
        if (this._isExecuting) {
            throw new Error('Action is already dispatched');
        }
        const self = this;
        this._handlers = handlers;
        this._isExecuting = true;
        this._isCompleted = {};
        Object.keys(handlers).forEach(storeName => {
            self._callHandler(storeName);
        });
    }
    /**
 * Calls an individual store's handler function
 * @method _callHandler
 * @param {String} storeName
 * @private
 * @throws {Error} if handler does not exist for storeName
 */
    _callHandler(storeName) {
        const self = this, handlerFn = self._handlers[storeName];
        if (!handlerFn) {
            throw new Error(`${ storeName } does not have a handler for action ${ self.name }`);
        }
        if (self._isCompleted[storeName]) {
            return;
        }
        self._isCompleted[storeName] = false;
        debug(`executing handler for ${ storeName }`);
        handlerFn(self.payload, self.name);
        self._isCompleted[storeName] = true;
    }
    /**
 * Waits until all stores have finished handling an action and then calls
 * the callback
 * @method waitFor
 * @param {String|String[]|Constructor|Constructor[]} stores An array of stores as strings or constructors to wait for
 * @param {Function} callback Called after all stores have completed handling their actions
 * @throws {Error} if the action is not being executed
 */
    waitFor(stores, callback) {
        const self = this;
        if (!self._isExecuting) {
            throw new Error('waitFor called even though there is no action being executed!');
        }
        if (!Array.isArray(stores)) {
            stores = [stores];
        }
        debug(`waiting on ${ stores.join(', ') }`);
        stores.forEach(storeName => {
            storeName = self.getStoreName(storeName);
            if (self._handlers[storeName]) {
                self._callHandler(storeName);
            }
        });
        callback();
    }
}
module.exports = Action;