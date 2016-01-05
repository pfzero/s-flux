var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var debug = require('debug');
var Im = require('immutable');
var BaseStore_1 = require('./BaseStore');
var generateUniqueId_1 = require('../utils/generateUniqueId');
var storeDebug = debug('app:flux:Stores:NotificationStore');
var NotificationStore = (function (_super) {
    __extends(NotificationStore, _super);
    /**
     * Implements basic store for storing relevant
     * notifications from BlueprintActions (e.g. USER_CREATE_ERROR, USER_CREATE_SUCCESS,
     * USER_UPDATE_ERROR, USER_UPDATE_SUCCESS, e.t.c.)
     *
     * @constructor
     * @param {Object} dispatcher the dispatcher
     */
    function NotificationStore(dispatcher) {
        _super.call(this, dispatcher);
        this.IDENTIFIERS = ['SUCCESS', 'ERROR'];
        this.RELEVANT_ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'ADDTO', 'LINK', 'UNLINK'];
        // list of notifications
        this.notifications = Im.List();
    }
    // processes the payload and identifies the error
    // returns false if the current action is not
    // errorneous
    NotificationStore.prototype.processHandlerArgs = function (payload, actionName) {
        var actionParts = actionName.toUpperCase().split('_'), endsWith = actionParts.pop(), baseAction = actionParts.join('_'), processedPayload = {}, IDENTIFIERS = this.IDENTIFIERS, RELEVANT_ACTIONS = this.RELEVANT_ACTIONS;
        // being the default action handler, this means
        // that all actions will flow through this
        // store; Check if the action was errorneous
        if (IDENTIFIERS.indexOf(endsWith) === -1) {
            return null;
        }
        var actionType = actionParts.pop().toUpperCase();
        // now check if we have a relevant error (e.g. if we didn't found a resource)
        // we should just display some Not Found page, not display a message;
        if (RELEVANT_ACTIONS.indexOf(actionType) === -1) {
            return null;
        }
        // store the base action (e.g. USER_CREATE)
        processedPayload.baseAction = baseAction;
        // store the type (e.g. SUCCESS or ERROR)
        processedPayload.type = endsWith;
        return processedPayload;
    };
    // parse the error payload
    // received from server
    NotificationStore.prototype.parseAction = function (payload, actionName) {
        return this.processHandlerArgs(payload, actionName);
    };
    // generate unique id
    NotificationStore.prototype.generateId = function () {
        return generateUniqueId_1.default();
    };
    /**
    * Returns the error based on actionType (e.g. user_create)
    * @public
    * @param {Im.Map} type the found error
    */
    NotificationStore.prototype.getByType = function (type) {
        var notifications = this.getAll();
        return notifications.find(function (err) {
            if (err.get('actionType') === type.toUpperCase()) {
                return true;
            }
        });
    };
    /**
     * Returns all the notifications from this store
     * @public
     * @return {Im.List}           the list of notifications
     */
    NotificationStore.prototype.getAll = function () {
        return this.notifications;
    };
    NotificationStore.getHandlers = function () {
        var handlers = {};
        // this handler will receive all the actions
        // flowing through dispatcher, regardless of them being
        // notifications or not; a few filters are applied to detect
        // the relevant actions
        handlers['default'] = function (storeInstance, payload, actionName) {
            var parsed = storeInstance.parseAction(payload, actionName);
            // no need to do anything else
            // if this is not an error, or it's not
            // a relevant error
            if (parsed === null) {
                return;
            }
            parsed.id = storeInstance.generateId();
            // transform to immutable
            var parsedIm = Im.fromJS(parsed);
            storeInstance.notifications = storeInstance.notifications.push(parsedIm);
            storeInstance.emitChangeAsync();
        };
        // handler for removing the error from
        // this store.
        handlers['REMOVE_NOTIFICATION'] = function (storeInstance, errorId) {
            var newCollection = storeInstance.getAll().filter(function (err) {
                return err.get('id') !== errorId;
            });
            storeInstance.notifications = newCollection;
            storeInstance.emitChangeAsync();
        };
        return handlers;
    };
    return NotificationStore;
})(BaseStore_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NotificationStore;
//# sourceMappingURL=NotificationStore.js.map