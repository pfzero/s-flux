var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var components = require('../appTypes/components');
var CHANGE_EVENT = 'change';
var BaseStore = (function (_super) {
    __extends(BaseStore, _super);
    /**
     * @class BaseStore
     * @extends EventEmitter
     * @param dispatcher The dispatcher interface
     * @constructor
     */
    function BaseStore(dispatcher) {
        _super.call(this, dispatcher);
        this.initialize = function () { };
    }
    /**
     * Convenience method for getting the store context object.
     * @method getContext
     * @return {Object} Returns the store context object.
     */
    BaseStore.prototype.getContext = function () {
        return this.dispatcher.getContext();
    };
    /**
     * Add a listener for the change event
     * @method addChangeListener
     * @param {Function} callback
     */
    BaseStore.prototype.addChangeListener = function (callback) {
        this.on(CHANGE_EVENT, callback);
    };
    /**
     * Remove a listener for the change event
     * @method removeChangeListener
     * @param {Function} callback
     */
    BaseStore.prototype.removeChangeListener = function (callback) {
        this.removeListener(CHANGE_EVENT, callback);
    };
    /**
     * Determines whether the store should dehydrate or not. By default, only dehydrates
     * if the store has emitted an update event. If no update has been emitted, it is assumed
     * that the store is in its default state and therefore does not need to dehydrate.
     * @method shouldDehydrate
     * @returns {boolean}
     */
    BaseStore.prototype.shouldDehydrate = function () {
        return this.hasChanged;
    };
    /**
     * Emit a change event
     * @method emitChange
     * @param {*} param=this
     */
    BaseStore.prototype.emitChange = function (param) {
        this.hasChanged = true;
        this.emit(CHANGE_EVENT, param || this);
    };
    /**
     * emitChange async, so we don't mess up component updates and errors
     * with store dispatching, resulting in wrong functionality
     */
    BaseStore.prototype.emitChangeAsync = function (param) {
        var _this = this;
        this.hasChanged = true;
        setImmediate(function () { return _this.emitChange(param); });
    };
    return BaseStore;
})(components.Store);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BaseStore;
//# sourceMappingURL=BaseStore.js.map