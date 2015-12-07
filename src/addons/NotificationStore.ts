'use strict';
const IDENTIFIERS = [
    'SUCCESS',
    'ERROR'
];
const RELEVANT_ACTIONS = [
    'CREATE',
    'UPDATE',
    'DELETE',
    'ADDTO',
    'LINK',
    'UNLINK'
];
const storeDebug = require('debug')('app:flux:Stores:NotificationStore'), Im = require('immutable'), inherits = require('inherits'), BaseStore = require('./BaseStore'), generateUniqueId = require('../utils/generateUniqueId'),
    // processes the payload and identifies the error
    // returns false if the current action is not
    // errorneous
    processHandlerArgs = function (payload, actionName) {
        let actionParts = actionName.toUpperCase().split('_'), endsWith = actionParts.pop(), baseAction = actionParts.join('_'), processedPayload = {}, IDENTIFIERS = this._IDENTIFIERS, RELEVANT_ACTIONS = this._RELEVANT_ACTIONS;
        // being the default action handler, this means
        // that all actions will flow through this
        // store; Check if the action was errorneous
        if (IDENTIFIERS.indexOf(endsWith) === -1) {
            return false;
        }
        const actionType = actionParts.pop().toUpperCase();
        // now check if we have a relevant error (e.g. if we didn't found a resource)
        // we should just display some Not Found page, not display a message;
        if (RELEVANT_ACTIONS.indexOf(actionType) === -1) {
            return false;
        }
        // store the base action (e.g. USER_CREATE)
        processedPayload.baseAction = baseAction;
        // store the type (e.g. SUCCESS or ERROR)
        processedPayload.type = endsWith;
        return processedPayload;
    };
class NotificationStore {
    /**
 * Implements basic store for storing relevant
 * notifications from BlueprintActions (e.g. USER_CREATE_ERROR, USER_CREATE_SUCCESS,
 * USER_UPDATE_ERROR, USER_UPDATE_SUCCESS, e.t.c.)
 *
 * @constructor
 * @param {Object} dispatcher the dispatcher
 */
    constructor() {
        // exstends BaseStore
        BaseStore.call(this, dispatcher);
        this._IDENTIFIERS = IDENTIFIERS;
        this._RELEVANT_ACTIONS = RELEVANT_ACTIONS;
        // list of notifications
        this.notifications = Im.List();
    }
    // parse the error payload
    // received from server
    parseAction(payload, actionName) {
        return processHandlerArgs.bind(this)(payload, actionName);
    }
    // generate unique id
    generateId() {
        return generateUniqueId.apply(this, arguments);
    }
    /**
 * Returns the error based on actionType (e.g. user_create)
 * @public
 * @param {Im.Map} type the found error
 */
    GetByType(type) {
        let notifications = this.GetAll();
        return notifications.find(err => {
            if (err.actionType === type.toUpperCase()) {
                return err;
            }
        });
    }
    /**
 * Returns all the notifications from this store
 * @public
 * @return {Im.List}           the list of notifications
 */
    GetAll() {
        return this.notifications;
    }
}
;
// NotificationStore extends BaseStore
inherits(NotificationStore, BaseStore);
// handlers 
NotificationStore.handlers = {
    // this handler will receive all the actions
    // flowing through dispatcher, regardless of them being
    // notifications or not; a few filters are applied to detect
    // the relevant actions
    default(payload, actionName) {
        let parsed = this.parseAction(payload, actionName);
        // no need to do anything else
        // if this is not an error, or it's not
        // a relevant error
        if (parsed === false) {
            return;
        }
        parsed.id = this.generateId();
        // transform to immutable
        parsed = Im.fromJS(parsed);
        this.notifications = this.notifications.push(parsed);
        this.emitChangeAsync();
    },
    // handler for removing the error from
    // this store.
    REMOVE_NOTIFICATION(errorId) {
        const newCollection = this.GetAll().filter(err => {
            return err.get('id') !== errorId;
        });
        this.notifications = newCollection;
        this.emitChangeAsync();
    }
};
module.exports = NotificationStore;