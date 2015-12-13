var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var debug = require('debug');
var Im = require('immutable');
var BaseStore_1 = require('./BaseStore');
var generateUniqueId_1 = require('../utils/generateUniqueId');
var ERROR_IDENTIFIER = 'ERROR', RELEVANT_ERRORS = ['CREATE', 'UPDATE', 'DELETE', 'ADDTO', 'LINK', 'UNLINK'];
var storeDebug = debug('app:flux:Stores:ErrorStore');
;
var ErrorStore = (function (_super) {
    __extends(ErrorStore, _super);
    /**
     * Implements basic store for storing relevant
     * errors from BlueprintActions (e.g. USER_CREATE_ERROR, USER_UPDATE_ERROR, e.t.c.)
     *
     * @constructor
     * @param {Object} dispatcher the dispatcher
     */
    function ErrorStore(dispatcher) {
        _super.call(this, dispatcher);
        this.ERROR_IDENTIFIER = ERROR_IDENTIFIER;
        this.RELEVANT_ERRORS = RELEVANT_ERRORS;
        this.errors = Im.List();
    }
    // processes the payload and identifies the error
    ErrorStore.prototype.processHandlerArgs = function (payload, actionName) {
        var actionParts = actionName.toUpperCase().split('_'), endsWith = actionParts.pop(), baseAction = actionParts.join('_'), processedPayload = {}, ERROR_IDENTIFIER = this.ERROR_IDENTIFIER, RELEVANT_ERRORS = this.RELEVANT_ERRORS;
        // being the default action handler, this means
        // that all actions will flow through this
        // store; Check if the action was errorneous
        if (endsWith !== ERROR_IDENTIFIER) {
            return null;
        }
        var actionType = actionParts.pop().toUpperCase();
        // now check if we have a relevant error (e.g. if we didn't found a resource)
        // we should just display some Not Found page, not display a message;
        if (RELEVANT_ERRORS.indexOf(actionType) === -1) {
            return null;
        }
        processedPayload.baseAction = baseAction.toUpperCase();
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
    // parse the error payload
    // received from server
    ErrorStore.prototype.parseAction = function (payload, actionName) {
        return this.processHandlerArgs(payload, actionName);
    };
    // generate unique id
    ErrorStore.prototype.generateId = function () {
        return generateUniqueId_1.default();
    };
    /**
     * Returns the error based on actionType (e.g. user_create)
     * @public
     * @param {Im.Map} type the found error
     */
    ErrorStore.prototype.GetByType = function (type) {
        var errors = this.GetAll();
        return errors.find(function (err) {
            if (err.get('baseAction') === type.toUpperCase()) {
                return true;
            }
        });
    };
    /**
     * Returns all the errors from this store
     * @public
     * @return {Im.List}           the list of errors
     */
    ErrorStore.prototype.GetAll = function () {
        return this.errors;
    };
    ErrorStore.getHandlers = function () {
        var handlers = {};
        // this handler will receive all the actions
        // flowing through dispatcher, regardless of them being
        // errors or not; a few filters are applied to detect
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
            storeInstance.errors = storeInstance.errors.push(parsedIm);
            storeInstance.emitChangeAsync();
        };
        // handler for removing the error from
        // this store.
        handlers['REMOVE_ERROR'] = function (storeInstance, errorId) {
            var newCollection = storeInstance.GetAll().filter(function (err) {
                return err.get('id') !== errorId;
            });
            storeInstance.errors = newCollection;
            storeInstance.emitChangeAsync();
        };
        return handlers;
    };
    return ErrorStore;
})(BaseStore_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ErrorStore;
//# sourceMappingURL=ErrorStore.js.map