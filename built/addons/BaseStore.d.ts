import components = require('../appTypes/components');
import shapes = require('../appTypes/shapes');
export default class BaseStore extends components.Store {
    protected initialize: {
        (): void;
    };
    /**
     * @class BaseStore
     * @extends EventEmitter
     * @param dispatcher The dispatcher interface
     * @constructor
     */
    constructor(dispatcher: shapes.IDispatcherInterface);
    /**
     * Convenience method for getting the store context object.
     * @method getContext
     * @return {Object} Returns the store context object.
     */
    getContext(): any;
    /**
     * Add a listener for the change event
     * @method addChangeListener
     * @param {Function} callback
     */
    addChangeListener(callback: Function): void;
    /**
     * Remove a listener for the change event
     * @method removeChangeListener
     * @param {Function} callback
     */
    removeChangeListener(callback: Function): void;
    /**
     * Determines whether the store should dehydrate or not. By default, only dehydrates
     * if the store has emitted an update event. If no update has been emitted, it is assumed
     * that the store is in its default state and therefore does not need to dehydrate.
     * @method shouldDehydrate
     * @returns {boolean}
     */
    shouldDehydrate(): boolean;
    /**
     * Emit a change event
     * @method emitChange
     * @param {*} param=this
     */
    emitChange(param?: any): void;
    /**
     * emitChange async, so we don't mess up component updates and errors
     * with store dispatching, resulting in wrong functionality
     */
    emitChangeAsync(param?: any): void;
}
