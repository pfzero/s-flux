
import debug = require('debug');
import Im = require('immutable');
import BaseStore from './BaseStore';
import generateUniqueId from '../utils/generateUniqueId';

import shapes = require('../appTypes/shapes');


const storeDebug = debug('app:flux:Stores:NotificationStore');

export interface IFlashNotification {
    baseAction: string;
    type: string;
    id: string;
}

export interface IFlashNotificationEntity extends Im.Map<string, any> { }
export interface IFlashNotificationEntityList extends Im.List<IFlashNotificationEntity> { }

export default class NotificationStore extends BaseStore {

    protected IDENTIFIERS = ['SUCCESS', 'ERROR'];
    protected RELEVANT_ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'ADDTO', 'LINK', 'UNLINK'];
    
    // processes the payload and identifies the error
    // returns false if the current action is not
    // errorneous
    protected processHandlerArgs(payload: shapes.IActionPayload, actionName: string): IFlashNotification {
        let actionParts = actionName.toUpperCase().split('_'),
            endsWith = actionParts.pop(),
            baseAction = actionParts.join('_'),
            processedPayload = <IFlashNotification>{},
            IDENTIFIERS = this.IDENTIFIERS,
            RELEVANT_ACTIONS = this.RELEVANT_ACTIONS;

        // being the default action handler, this means
        // that all actions will flow through this
        // store; Check if the action was errorneous
        if (IDENTIFIERS.indexOf(endsWith) === -1) {
            return null;
        }

        const actionType = actionParts.pop().toUpperCase();

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
    }

    // list of notifications
    public notifications = <IFlashNotificationEntityList>Im.List();
    
    /**
     * Implements basic store for storing relevant
     * notifications from BlueprintActions (e.g. USER_CREATE_ERROR, USER_CREATE_SUCCESS,
     * USER_UPDATE_ERROR, USER_UPDATE_SUCCESS, e.t.c.)
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
    generateId() {
        return generateUniqueId();
    }

    /**
    * Returns the error based on actionType (e.g. user_create)
    * @public
    * @param {Im.Map} type the found error
    */
    GetByType(type: string) {
        let notifications = this.GetAll();

        return notifications.find(err => {
            if (err.get('actionType') === type.toUpperCase()) {
                return true;
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

    public static getHandlers(): shapes.IStoreDispatcher {
        let handlers = <shapes.IStoreDispatcher>{};

        // this handler will receive all the actions
        // flowing through dispatcher, regardless of them being
        // notifications or not; a few filters are applied to detect
        // the relevant actions
        handlers['default'] = (storeInstance: NotificationStore, payload: shapes.IActionPayload, actionName: string) => {
            let parsed = storeInstance.parseAction(payload, actionName);
            // no need to do anything else
            // if this is not an error, or it's not
            // a relevant error
            if (parsed === null) {
                return;
            }

            parsed.id = storeInstance.generateId();
            
            // transform to immutable
            let parsedIm = Im.fromJS(parsed);
            storeInstance.notifications = storeInstance.notifications.push(parsedIm);
            storeInstance.emitChangeAsync();
        };

        // handler for removing the error from
        // this store.
        handlers['REMOVE_NOTIFICATION'] = (storeInstance: NotificationStore, errorId: string) => {

            const newCollection = <IFlashNotificationEntityList>storeInstance.GetAll().filter(err => {
                return err.get('id') !== errorId;
            });
            storeInstance.notifications = newCollection;
            storeInstance.emitChangeAsync();
        }
        return handlers;
    }
}