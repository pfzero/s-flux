/**
 * Copyright 2014, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';

var Action = require('./Action');
var DEFAULT = 'default';
var DispatcherContext = require('./DispatcherContext');

/**
 * @class Dispatcher
 * @param {Object} options Dispatcher options
 * @param {Array} options.stores Array of stores to register
 * @constructor
 */
function Dispatcher(options) {
    options = options || {};
    options.stores = options.stores || [];
    this.stores = {};
    this.handlers = {};
    this.actions = {};
    this.config = options.config || {};
    this.handlers[DEFAULT] = [];
    options.stores.forEach(function(store) {
        this.registerStore(store);
    }, this);

    // set configurations for request
    require('../addons/Rest').setConfig(this.config);
}

Dispatcher.prototype.createContext = function createContext(context) {
    return new DispatcherContext(this, context);
};

/**
 * Registers a store so that it can handle actions.
 * @method registerStore
 * @static
 * @param {Object} store A store class to be registered. The store should have a static
 *      `name` property so that it can be loaded later.
 * @throws {Error} if store is invalid
 * @throws {Error} if store is already registered
 */
Dispatcher.prototype.registerStore = function registerStore(store) {
    if ('function' !== typeof store) {
        throw new Error('registerStore requires a constructor as first parameter');
    }
    var storeName = this.getStoreName(store);
    if (!storeName) {
        throw new Error('Store is required to have a `storeName` property.');
    }
    if (this.stores[storeName]) {
        if (this.stores[storeName] === store) {
            // Store is already registered, nothing to do
            return;
        }
        throw new Error('Store with name `' + storeName + '` has already been registered.');
    }
    this.stores[storeName] = store;
    if (store.handlers) {
        Object.keys(store.handlers).forEach(function storeHandlersEach(action) {
            var handler = store.handlers[action];
            this._registerHandler(action, storeName, handler);
        }, this);
    }
};

/**
 * Method to discover if a storeName has been registered
 * @method isRegistered
 * @static
 * @param {Object|String} store The store to check
 * @returns {boolean}
 */
Dispatcher.prototype.isRegistered = function isRegistered(store) {
    var storeName = this.getStoreName(store),
        storeInstance = this.stores[storeName];

    if (!storeInstance) {
        return false;
    }

    if ('function' === typeof store) {
        if (store !== storeInstance) {
            return false;
        }
    }
    return true;
};

/**
 * Gets a name from a store
 * @method getStoreName
 * @static
 * @param {String|Object} store The store name or class from which to extract
 *      the name
 * @returns {String}
 */
Dispatcher.prototype.getStoreName = function getStoreName(store) {
    if ('string' === typeof store) {
        return store;
    }
    return store.storeName || store.name;
};

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
Dispatcher.prototype._registerHandler = function registerHandler(action, name, handler) {
    this.handlers[action] = this.handlers[action] || [];
    this.handlers[action].push({
        name: this.getStoreName(name),
        handler: handler
    });
    return this.handlers.length - 1;
};

Dispatcher.prototype.registerActions = function(groupName, actionsCreatorInstance) {
    var act;

    if (!groupName) {
        throw new TypeError("The name of the actions group is required! Set a name for these actions, for example: UserActions");
    }

    if (typeof actionsCreatorInstance === 'function') {
        act = new actionsCreatorInstance();
    } else {
        act = actionsCreatorInstance;
    }

    if (this.actions[groupName]) {
        throw new Error("Actions for " + groupName + " already registered!");
    }

    this.actions[groupName] = act;
};

module.exports = Dispatcher;