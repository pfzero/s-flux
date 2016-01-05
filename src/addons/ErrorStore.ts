
import debug = require('debug');
import Im = require('immutable');
import BaseStore from './BaseStore';
import generateUniqueId from '../utils/generateUniqueId';

import shapes = require('../appTypes/shapes');

let ERROR_IDENTIFIER = 'ERROR',
    RELEVANT_ERRORS = ['CREATE', 'UPDATE', 'DELETE', 'ADDTO', 'LINK', 'UNLINK'];

const storeDebug = debug('app:flux:Stores:ErrorStore');

export interface IProcessedError {
    id: string;
    baseAction: string;
    error: Error | shapes.IParsedResponse;
    userInput: any;
    resourceId?: string;
    subResourceName?: string;
    subResourceId: string;
};

export interface IErrorEntity extends Im.Map<string, any> { }
export interface IErrorEntityList extends Im.List<IErrorEntity> { }

export default class ErrorStore extends BaseStore {

    protected ERROR_IDENTIFIER = ERROR_IDENTIFIER;
    protected RELEVANT_ERRORS = RELEVANT_ERRORS;

    public errors = <IErrorEntityList>Im.List();

    // processes the payload and identifies the error
    protected processHandlerArgs(payload: shapes.IActionPayload, actionName: string): IProcessedError {
        let actionParts = actionName.toUpperCase().split('_'),
            endsWith = actionParts.pop(),
            baseAction = actionParts.join('_'),
            processedPayload = <IProcessedError>{},
            ERROR_IDENTIFIER = this.ERROR_IDENTIFIER,
            RELEVANT_ERRORS = this.RELEVANT_ERRORS;

        // being the default action handler, this means
        // that all actions will flow through this
        // store; Check if the action was errorneous
        if (endsWith !== ERROR_IDENTIFIER) {
            return null;
        }

        const actionType = actionParts.pop().toUpperCase();
        
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
    }


    /**
     * Implements basic store for storing relevant
     * errors from BlueprintActions (e.g. USER_CREATE_ERROR, USER_UPDATE_ERROR, e.t.c.)
     *
     * @constructor
     * @param {Object} dispatcher the dispatcher
     */
    constructor(dispatcher: shapes.IDispatcherInterface) {
        super(dispatcher);
    }
    
    // parse the error payload
    // received from server
    parseAction(payload: shapes.IActionPayload, actionName: string) {
        return this.processHandlerArgs(payload, actionName);
    }
    
    // generate unique id
    generateId(): string {
        return generateUniqueId();
    }
    
    /**
     * Returns the error based on actionType (e.g. user_create)
     * @public
     * @param {Im.Map} type the found error
     */
    getByType(type: string) {
        let errors = this.getAll();

        return errors.find(err => {
            if (err.get('baseAction') === type.toUpperCase()) {
                return true;
            }
        });
    }
    
    /**
     * Returns all the errors from this store
     * @public
     * @return {Im.List}           the list of errors
     */
    getAll() {
        return this.errors;
    }

    public static getHandlers(): shapes.IStoreDispatcher {
        let handlers: shapes.IStoreDispatcher = {};

        // this handler will receive all the actions
        // flowing through dispatcher, regardless of them being
        // errors or not; a few filters are applied to detect
        // the relevant actions
        handlers['default'] = (storeInstance: ErrorStore, payload: shapes.IActionPayload, actionName: string) => {
            let parsed = storeInstance.parseAction(payload, actionName);

            // no need to do anything else
            // if this is not an error, or it's not
            // a relevant error
            if (parsed === null) {
                return;
            }

            parsed.id = storeInstance.generateId();
            
            // transform to immutable
            let parsedIm = <IErrorEntity>Im.fromJS(parsed);

            storeInstance.errors = storeInstance.errors.push(parsedIm);
            storeInstance.emitChangeAsync();
        }

        // handler for removing the error from
        // this store.
        handlers['REMOVE_ERROR'] = (storeInstance: ErrorStore, errorId: string) => {

            const newCollection = <IErrorEntityList>storeInstance.getAll().filter(err => {
                return err.get('id') !== errorId;
            });

            storeInstance.errors = newCollection;
            storeInstance.emitChangeAsync();
        }

        return handlers;
    }
}