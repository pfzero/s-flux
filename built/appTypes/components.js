var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var EventEmitter3 = require('eventemitter3');
var CHANGE_EVENT = 'change';
var Store = (function (_super) {
    __extends(Store, _super);
    /**
     * @class BaseStore
     * @extends EventEmitter
     * @param dispatcher The dispatcher interface
     * @constructor
     */
    function Store(dispatcher) {
        _super.call(this);
        this.dispatcher = dispatcher;
        this.hasChanged = false;
        this.initialize = function () { };
    }
    Store.getHandlers = function () {
        return {};
    };
    /**
     * Convenience method for getting the store context object.
     * @method getContext
     * @return {Object} Returns the store context object.
     */
    Store.prototype.getContext = function () {
        return this.dispatcher.getContext();
    };
    /**
     * Add a listener for the change event
     * @method addChangeListener
     * @param {Function} callback
     */
    Store.prototype.addChangeListener = function (callback) {
        this.on(CHANGE_EVENT, callback);
    };
    /**
     * Remove a listener for the change event
     * @method removeChangeListener
     * @param {Function} callback
     */
    Store.prototype.removeChangeListener = function (callback) {
        this.removeListener(CHANGE_EVENT, callback);
    };
    /**
     * Determines whether the store should dehydrate or not. By default, only dehydrates
     * if the store has emitted an update event. If no update has been emitted, it is assumed
     * that the store is in its default state and therefore does not need to dehydrate.
     * @method shouldDehydrate
     * @returns {boolean}
     */
    Store.prototype.shouldDehydrate = function () {
        return this.hasChanged;
    };
    Store.prototype.dehydrate = function () {
        return {};
    };
    Store.prototype.rehydrate = function (dehydrated) { };
    /**
     * Emit a change event
     * @method emitChange
     * @param {*} param=this
     */
    Store.prototype.emitChange = function (param) {
        this.hasChanged = true;
        this.emit(CHANGE_EVENT, param || this);
    };
    /**
     * emitChange async, so we don't mess up component updates and errors
     * with store dispatching, resulting in wrong functionality
     */
    Store.prototype.emitChangeAsync = function (param) {
        var _this = this;
        setImmediate(function () { return _this.emitChange(param); });
    };
    return Store;
})(EventEmitter3);
exports.Store = Store;
//# sourceMappingURL=components.js.map