'use strict';

var IDENTIFIERS = ["SUCCESS", "ERROR"];

var RELEVANT_ACTIONS = ["CREATE", "UPDATE", "DELETE", "ADDTO", "LINK", "UNLINK"];

var storeDebug = require('debug')("app:flux:Stores:NotificationsStore"),
    Im = require('immutable'),
    inherits = require('inherits'),
    BaseStore = require('./BaseStore'),

    generateUniqueId = require("../utils/generateUniqueId"),

    // processes the payload and identifies the error
    // returns false if the current action is not
    // errorneous
    processHandlerArgs = function(payload, actionName) {
        var actionParts = actionName.toUpperCase().split("_"),
            endsWith = actionParts.pop(),
            baseError = actionParts.join("_"),
            processedPayload = {},
            IDENTIFIERS = this._IDENTIFIERS,
            RELEVANT_ACTIONS = this._RELEVANT_ACTIONS;

        // being the default action handler, this means
        // that all actions will flow through this
        // store; Check if the action was errorneous
        if (IDENTIFIERS.indexOf(endsWith) === -1) {
            return false;
        }

        var actionType = actionParts.pop();

        // now check if we have a relevant error (e.g. if we didn't found a resource)
        // we should just display some Not Found page, not display a message;
        if (RELEVANT_ACTIONS.indexOf(actionType) === -1) {
            return false;
        }


        processedPayload.baseAction = actionType;
        // now process payload
        switch (actionType) {

            // create
            case RELEVANT_ACTIONS[0]:
                processedPayload.userInput = payload.givenInput[0];
                processedPayload.error = payload.err;
                break;

                // update
            case RELEVANT_ACTIONS[1]:
                processedPayload.resourceId = payload.givenInput[0];
                processedPayload.userInput = payload.givenInput[1];
                processedPayload.error = payload.err;
                break;

                // delete
            case RELEVANT_ACTIONS[2]:
                processedPayload.resourceId = payload.givenInput[0];
                processedPayload.error = payload.err;
                break;

                // addTo
            case RELEVANT_ACTIONS[3]:
                processedPayload.resourceId = payload.givenInput[0];
                processedPayload.subResourceName = payload.givenInput[1];
                processedPayload.userInput = payload.givenInput[2];
                break;

                // link
                // case unlink
            case RELEVANT_ACTIONS[4]:
            case RELEVANT_ACTIONS[5]:
                processedPayload.resourceId = payload.givenInput[0];
                processedPayload.subResourceName = payload.givenInput[1];
                processedPayload.subResourceId = payload.givenInput[2];
                break;
        }

        return processedPayload;
    };

/**
 * Implements basic store for storing relevant
 * notifications from BlueprintActions (e.g. USER_CREATE_ERROR, USER_CREATE_SUCCESS,
 * USER_UPDATE_ERROR, USER_UPDATE_SUCCESS, e.t.c.)
 *
 * @constructor
 * @param {Object} dispatcher the dispatcher
 */
function NotificationsStore(dispatcher) {

    // exstends BaseStore
    BaseStore.call(this, dispatcher);

    this._IDENTIFIERS = IDENTIFIERS;
    this._RELEVANT_ACTIONS = RELEVANT_ACTIONS;

    // list of notifications
    this.notifications = Im.List();
};

// NotificationsStore extends BaseStore
inherits(NotificationsStore, BaseStore);


// parse the error payload
// received from server
NotificationsStore.prototype.parseAction = function(payload, actionName) {
    return processHandlerArgs.bind(this)(payload, actionName);
}

// generate unique id
NotificationsStore.prototype.generateId = generateUniqueId;

/**
 * Returns the error based on actionType (e.g. user_create)
 * @public
 * @param {Im.Map} type the found error
 */
NotificationsStore.prototype.GetByType = function(type) {
    var notifications = this.GetAll();

    return notifications.find(function(err) {
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
NotificationsStore.prototype.GetAll() = function(arguments) {
    return this.notifications;
}

// handlers 
NotificationsStore.handlers = {

    // this handler will receive all the actions
    // flowing through dispatcher, regardless of them being
    // notifications or not; a few filters are applied to detect
    // the relevant actions
    default: function(payload, actionName) {
        var parsed = this.parseAction(payload, actionName);

        // no need to do anything else
        // if this is not an error, or it's not
        // a relevant error
        if (parsed === false) {
            return;
        }

        parsed.id = this.generateId();

        // transform to immutable
        parsed = Im.fromJS(parsed);

        this.notifications.add(parsed);

        this.emitChange();
    },

    // handler for removing the error from
    // this store.
    REMOVE_NOTIFICATION: function(errorId) {
        var newCollection = this.GetAll().filter(function(err) {
            return err.get('id') !== errorId;
        });

        this.notifications = newCollection;
        this.emitChange();
    }
};

module.exports = NotificationsStore;