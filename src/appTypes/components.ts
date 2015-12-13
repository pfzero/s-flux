
import shapes = require('./shapes');
import EventEmitter3 = require('eventemitter3');

const CHANGE_EVENT = 'change';

export abstract class Store extends EventEmitter3 {

	public static getHandlers(): shapes.IStoreDispatcher {
		return {};
	}

	protected hasChanged: boolean = false;

	protected initialize: { (): void } = () => { }
	
	/**
	 * @class BaseStore
	 * @extends EventEmitter
	 * @param dispatcher The dispatcher interface
	 * @constructor
	 */
	constructor(protected dispatcher: shapes.IDispatcherInterface) {
		super();
	}
	
	/**
	 * Convenience method for getting the store context object.
	 * @method getContext
	 * @return {Object} Returns the store context object.
	 */
	public getContext() {
		return this.dispatcher.getContext();
	}

	/**
	 * Add a listener for the change event
	 * @method addChangeListener
	 * @param {Function} callback
	 */
	public addChangeListener(callback: Function) {
		this.on(CHANGE_EVENT, callback);
	}

	/**
	 * Remove a listener for the change event
	 * @method removeChangeListener
	 * @param {Function} callback
	 */
	public removeChangeListener(callback: Function) {
		this.removeListener(CHANGE_EVENT, callback);
	}

	/**
	 * Determines whether the store should dehydrate or not. By default, only dehydrates
	 * if the store has emitted an update event. If no update has been emitted, it is assumed
	 * that the store is in its default state and therefore does not need to dehydrate.
	 * @method shouldDehydrate
	 * @returns {boolean}
	 */
	public shouldDehydrate(): boolean {
		return this.hasChanged;
	}

	public dehydrate(): any {
		return {};
	}

	public rehydrate(dehydrated: any): any { }

	/**
	 * Emit a change event
	 * @method emitChange
	 * @param {*} param=this
	 */
	public emitChange(param: any) {
		this.hasChanged = true;
		this.emit(CHANGE_EVENT, param || this);
	}
	
	/**
	 * emitChange async, so we don't mess up component updates and errors
	 * with store dispatching, resulting in wrong functionality
	 */
	public emitChangeAsync(param: any) {
		setImmediate(() => this.emitChange(param));
	}
}
