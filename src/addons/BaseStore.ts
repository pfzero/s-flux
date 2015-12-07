/**
 * Copyright 2014, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

import EventEmitter3 = require('eventemitter3');

const CHANGE_EVENT = 'change';

abstract class BaseStore extends EventEmitter3 {

    private hasChanged: boolean = false;

    protected initialize: { (): void } = () => { }

    /**
     * @class BaseStore
     * @extends EventEmitter
     * @param dispatcher The dispatcher interface
     * @constructor
     */
    constructor(private dispatcher: any) {
        super();
        this.initialize();
    }
    
    /**
     * Convenience method for getting the store context object.
     * @method getContext
     * @return {Object} Returns the store context object.
     */
    getContext() {
        return this.dispatcher.getContext();
    }
 
    /**
     * Add a listener for the change event
     * @method addChangeListener
     * @param {Function} callback
     */
    addChangeListener(callback: Function) {
        this.on(CHANGE_EVENT, callback);
    }
    
    /**
     * Remove a listener for the change event
     * @method removeChangeListener
     * @param {Function} callback
     */
    removeChangeListener(callback: Function) {
        this.removeListener(CHANGE_EVENT, callback);
    }
   
    /**
     * Determines whether the store should dehydrate or not. By default, only dehydrates
     * if the store has emitted an update event. If no update has been emitted, it is assumed
     * that the store is in its default state and therefore does not need to dehydrate.
     * @method shouldDehydrate
     * @returns {boolean}
     */
    shouldDehydrate(): boolean {
        return this.hasChanged;
    }
   
    /**
     * Emit a change event
     * @method emitChange
     * @param {*} param=this
     */
    emitChange(param: any) {
        this.hasChanged = true;
        this.emit(CHANGE_EVENT, param || this);
    }
    
    /**
     * emitChange async, so we don't mess up component updates and errors
     * with store dispatching, resulting in wrong functionality
     */
    emitChangeAsync(param: any) {
        setImmediate(() => this.emitChange(param));
    }
}

export default BaseStore;