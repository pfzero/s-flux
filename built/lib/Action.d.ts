import shapes = require('../appTypes/shapes');
export declare class Action {
    actionName: string;
    payload: shapes.IActionPayload;
    private handlers;
    private isExecuting;
    private isCompleted;
    private storeInstances;
    constructor(actionName: string, payload: shapes.IActionPayload);
    private getStore(storeName);
    /**
     * Calls an individual store's handler function
     * @method callHandler
     * @param {String} storeName
     * @private
     * @throws {Error} if handler does not exist for storeName
     */
    private callHandler(storeName);
    setStoreInstances(stores: shapes.IStoreInstanceMap): void;
    /**
     * Executes all handlers for the action
     * @method execute
     * @param {Function[]} handlers A mapping of store names to handler function
     * @throws {Error} if action has already been executed
     */
    execute(handlers: shapes.IDispatcherMap): void;
    /**
     * Waits until all stores have finished handling an action and then calls
     * the callback
     * @method waitFor
     * @param {String|String[]|Constructor|Constructor[]} stores An array of stores as strings or constructors to wait for
     * @param {Function} callback Called after all stores have completed handling their actions
     * @throws {Error} if the action is not being executed
     */
    waitFor(stores: string | string[], callback: Function): void;
}
