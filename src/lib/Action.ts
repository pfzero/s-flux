'use strict';

import debug = require('debug');

import shapes = require('../appTypes/shapes');

const actionDebug = debug('Dispatchr:Action');


export class Action {

    private handlers: shapes.IDispatcherMap = {};

    private isExecuting: boolean = false;

    private isCompleted: { [storeName: string]: boolean } = {};

    private storeInstances: shapes.IStoreInstanceMap = {};

    constructor(public actionName: string, public payload: shapes.IActionPayload) { }


    private getStore(storeName: string) {
        return this.storeInstances[storeName];
    }
    
    
    /**
     * Calls an individual store's handler function
     * @method callHandler
     * @param {String} storeName
     * @private
     * @throws {Error} if handler does not exist for storeName
     */
    private callHandler(storeName: string): void {
        const handlerFn = this.handlers[storeName];

        if (!handlerFn) {
            throw new Error(`${ storeName } does not have a handler for action ${ self.name }`);
        }

        if (this.isCompleted[storeName]) {
            return;
        }
        this.isCompleted[storeName] = false;

        debug(`executing handler for ${ storeName }`);

        let storeInstance = this.getStore(storeName);

        handlerFn(storeInstance, this.payload, this.actionName);

        this.isCompleted[storeName] = true;
    }

    public setStoreInstances(stores: shapes.IStoreInstanceMap): void {
        this.storeInstances = stores;
    }

    /**
     * Executes all handlers for the action
     * @method execute
     * @param {Function[]} handlers A mapping of store names to handler function
     * @throws {Error} if action has already been executed
     */
    public execute(handlers: shapes.IDispatcherMap): void {

        if (this.isExecuting) {
            throw new Error('Action is already dispatched');
        }

        const self = this;
        this.handlers = handlers;
        this.isExecuting = true;
        this.isCompleted = {};

        Object.keys(handlers).forEach(storeName => {
            self.callHandler(storeName);
        });
    }
    
    /**
     * Waits until all stores have finished handling an action and then calls
     * the callback
     * @method waitFor
     * @param {String|String[]|Constructor|Constructor[]} stores An array of stores as strings or constructors to wait for
     * @param {Function} callback Called after all stores have completed handling their actions
     * @throws {Error} if the action is not being executed
     */
    public waitFor(stores: string | string[], callback: Function): void {
        const self = this;
        let storesToWait: string[] = [];

        if (!self.isExecuting) {
            throw new Error('waitFor called even though there is no action being executed!');
        }

        if (!Array.isArray(stores)) {
            storesToWait = [stores];
        } else {
            storesToWait = stores;
        }

        debug(`waiting on ${ storesToWait.join(', ') }`);

        storesToWait.forEach(storeName => {
            if (typeof this.handlers[storeName] === 'function') {
                this.callHandler(storeName);
            }
        });
        callback();
    }
}
