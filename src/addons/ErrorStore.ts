'use strict';
const ERROR_IDENTIFIER = 'ERROR', RELEVANT_ERRORS = [
        'CREATE',
        'UPDATE',
        'DELETE',
        'ADDTO',
        'LINK',
        'UNLINK'
    ];
const storeDebug = require('debug')('app:flux:Stores:ErrorStore'), Im = require('immutable'), inherits = require('inherits'), BaseStore = require('./BaseStore'), generateUniqueId = require('../utils/generateUniqueId'),
    // processes the payload and identifies the error
    // returns false if the current action is not
    // errorneous
    processHandlerArgs = function (payload, actionName) {
        let actionParts = actionName.toUpperCase().split('_'), endsWith = actionParts.pop(), baseAction = actionParts.join('_'), processedPayload = {}, ERROR_IDENTIFIER = this._ERROR_IDENTIFIER, RELEVANT_ERRORS = this._RELEVANT_ERRORS;
        // being the default action handler, this means
        // that all actions will flow through this
        // store; Check if the action was errorneous
        if (endsWith !== ERROR_IDENTIFIER) {
            return false;
        }
        const actionType = actionParts.pop().toUpperCase();
        // now check if we have a relevant error (e.g. if we didn't found a resource)
        // we should just display some Not Found page, not display a message;
        if (RELEVANT_ERRORS.indexOf(actionType) === -1) {
            return false;
        }
        processedPayload.baseAction = baseAction;
        // now process payload
        switch (actionType) {
        // create
        case RELEVANT_ERRORS[0]:
            processedPayload.userInput = payload.givenInput[0];
            processedPayload.error = payload.error;
            break;
        // update
        case RELEVANT_ERRORS[1]:
            processedPayload.resourceId = payload.givenInput[0];
            processedPayload.userInput = payload.givenInput[1];
            processedPayload.error = payload.error;
            break;
        // delete
        case RELEVANT_ERRORS[2]:
            processedPayload.resourceId = payload.givenInput[0];
            processedPayload.error = payload.error;
            break;
        // addTo
        case RELEVANT_ERRORS[3]:
            processedPayload.resourceId = payload.givenInput[0];
            processedPayload.subResourceName = payload.givenInput[1];
            processedPayload.userInput = payload.givenInput[2];
            processedPayload.error = payload.error;
            break;
        // link
        // case unlink
        case RELEVANT_ERRORS[4]:
        case RELEVANT_ERRORS[5]:
            processedPayload.resourceId = payload.givenInput[0];
            processedPayload.subResourceName = payload.givenInput[1];
            processedPayload.subResourceId = payload.givenInput[2];
            processedPayload.error = payload.error;
            break;
        }
        return processedPayload;
    };
class ErrorStore {
    /**
 * Implements basic store for storing relevant
 * errors from BlueprintActions (e.g. USER_CREATE_ERROR, USER_UPDATE_ERROR, e.t.c.)
 *
 * @constructor
 * @param {Object} dispatcher the dispatcher
 */
    constructor() {
        // exstends BaseStore
        BaseStore.call(this, dispatcher);
        this._RELEVANT_ERRORS = RELEVANT_ERRORS;
        this._ERROR_IDENTIFIER = ERROR_IDENTIFIER;
        // list of errors
        this.errors = Im.List();
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
        let errors = this.GetAll();
        return errors.find(err => {
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
    GetAll() {
        return this.errors;
    }
}
;
// ErrorStore extends BaseStore
inherits(ErrorStore, BaseStore);
// handlers 
ErrorStore.handlers = {
    // this handler will receive all the actions
    // flowing through dispatcher, regardless of them being
    // errors or not; a few filters are applied to detect
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
        this.errors = this.errors.push(parsed);
        this.emitChangeAsync();
    },
    // handler for removing the error from
    // this store.
    REMOVE_ERROR(errorId) {
        const newCollection = this.GetAll().filter(err => {
            return err.get('id') !== errorId;
        });
        this.errors = newCollection;
        this.emitChangeAsync();
    }
};
module.exports = ErrorStore;