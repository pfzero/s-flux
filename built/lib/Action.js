'use strict';
var debug = require('debug');
var actionDebug = debug('Dispatchr:Action');
var Action = (function () {
    function Action(actionName, payload) {
        this.actionName = actionName;
        this.payload = payload;
        this.handlers = {};
        this.isExecuting = false;
        this.isCompleted = {};
        this.storeInstances = {};
    }
    Action.prototype.getStore = function (storeName) {
        return this.storeInstances[storeName];
    };
    /**
     * Calls an individual store's handler function
     * @method callHandler
     * @param {String} storeName
     * @private
     * @throws {Error} if handler does not exist for storeName
     */
    Action.prototype.callHandler = function (storeName) {
        var handlerFn = this.handlers[storeName];
        if (!handlerFn) {
            throw new Error(storeName + " does not have a handler for action " + self.name);
        }
        if (this.isCompleted[storeName]) {
            return;
        }
        this.isCompleted[storeName] = false;
        debug("executing handler for " + storeName);
        var storeInstance = this.getStore(storeName);
        handlerFn(storeInstance, this.payload, this.actionName);
        this.isCompleted[storeName] = true;
    };
    Action.prototype.setStoreInstances = function (stores) {
        this.storeInstances = stores;
    };
    /**
     * Executes all handlers for the action
     * @method execute
     * @param {Function[]} handlers A mapping of store names to handler function
     * @throws {Error} if action has already been executed
     */
    Action.prototype.execute = function (handlers) {
        if (this.isExecuting) {
            throw new Error('Action is already dispatched');
        }
        var self = this;
        this.handlers = handlers;
        this.isExecuting = true;
        this.isCompleted = {};
        Object.keys(handlers).forEach(function (storeName) {
            self.callHandler(storeName);
        });
    };
    /**
     * Waits until all stores have finished handling an action and then calls
     * the callback
     * @method waitFor
     * @param {String|String[]|Constructor|Constructor[]} stores An array of stores as strings or constructors to wait for
     * @param {Function} callback Called after all stores have completed handling their actions
     * @throws {Error} if the action is not being executed
     */
    Action.prototype.waitFor = function (stores, callback) {
        var _this = this;
        var self = this;
        var storesToWait = [];
        if (!self.isExecuting) {
            throw new Error('waitFor called even though there is no action being executed!');
        }
        if (!Array.isArray(stores)) {
            storesToWait = [stores];
        }
        else {
            storesToWait = stores;
        }
        debug("waiting on " + storesToWait.join(', '));
        storesToWait.forEach(function (storeName) {
            if (typeof _this.handlers[storeName] === 'function') {
                _this.callHandler(storeName);
            }
        });
        callback();
    };
    return Action;
})();
exports.Action = Action;
//# sourceMappingURL=Action.js.map