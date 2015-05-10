'use strict';

var ERROR_IDENTIFIER = "ERROR",
    RELEVANT_ERRORS = ["CREATE", "UPDATE", "DELETE", "ADDTO", "LINK", "UNLINK"];

var storeDebug = require('debug')("app:flux:Stores:ErrorStore"),
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
            ERROR_IDENTIFIER = this._ERROR_IDENTIFIER,
            RELEVANT_ERRORS = this._RELEVANT_ERRORS;

        // being the default action handler, this means
        // that all actions will flow through this
        // store; Check if the action was errorneous
        if (endsWith !== ERROR_IDENTIFIER) {
            return false;
        }

        var actionType = actionParts.pop();

        // now check if we have a relevant error (e.g. if we didn't found a resource)
        // we should just display some Not Found page, not display a message;
        if (RELEVANT_ERRORS.indexOf(actionType) === -1) {
            return false;
        }


        processedPayload.baseAction = actionType;
        // now process payload
        switch (actionType) {

            // create
            case RELEVANT_ERRORS[0]:
                processedPayload.userInput = payload.givenInput[0];
                processedPayload.error = payload.err;
                break;

                // update
            case RELEVANT_ERRORS[1]:
                processedPayload.resourceId = payload.givenInput[0];
                processedPayload.userInput = payload.givenInput[1];
                processedPayload.error = payload.err;
                break;

                // delete
            case RELEVANT_ERRORS[2]:
                processedPayload.resourceId = payload.givenInput[0];
                processedPayload.error = payload.err;
                break;

                // addTo
            case RELEVANT_ERRORS[3]:
                processedPayload.resourceId = payload.givenInput[0];
                processedPayload.subResourceName = payload.givenInput[1];
                processedPayload.userInput = payload.givenInput[2];
                break;

                // link
                // case unlink
            case RELEVANT_ERRORS[4]:
            case RELEVANT_ERRORS[5]:
                processedPayload.resourceId = payload.givenInput[0];
                processedPayload.subResourceName = payload.givenInput[1];
                processedPayload.subResourceId = payload.givenInput[2];
                break;
        }

        return processedPayload;
    };

/**
 * Implements basic store for storing relevant
 * errors from BlueprintActions (e.g. USER_CREATE_ERROR, USER_UPDATE_ERROR, e.t.c.)
 *
 * @constructor
 * @param {Object} dispatcher the dispatcher
 */
function ErrorStore(dispatcher) {

    // exstends BaseStore
    BaseStore.call(this, dispatcher);

    this._RELEVANT_ERRORS = RELEVANT_ERRORS;
    this._ERROR_IDENTIFIER = ERROR_IDENTIFIER;

    // list of errors
    this.errors = Im.List();
};

// ErrorStore extends BaseStore
inherits(ErrorStore, BaseStore);


// parse the error payload
// received from server
ErrorStore.prototype.parseAction = function(payload, actionName) {
    return processHandlerArgs.bind(this)(payload, actionName);
}

// generate unique id
ErrorStore.prototype.generateId = generateUniqueId;

/**
 * Returns the error based on actionType (e.g. user_create)
 * @public
 * @param {Im.Map} type the found error
 */
ErrorStore.prototype.GetByType = function(type) {
    var errors = this.GetAll();

    return errors.find(function(err) {
        if (err.actionType === type.toUpperCase()) {
            return err;
        }
    });
}

/**
 * Returns all the errors from this store
 * @public
 * @return {Im.List}           the list of errors
 */
ErrorStore.prototype.GetAll() = function(arguments) {
    return this.errors;
}

// handlers 
ErrorStore.handlers = {

    // this handler will receive all the actions
    // flowing through dispatcher, regardless of them being
    // errors or not; a few filters are applied to detect
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

        this.errors.add(parsed);

        this.emitChange();
    },

    // handler for removing the error from
    // this store.
    REMOVE_ERROR: function(errorId) {
        var newCollection = this.GetAll().filter(function(err) {
            return err.get('id') !== errorId;
        });

        this.errors = newCollection;
        this.emitChange();
    }
};

module.exports = ErrorStore;