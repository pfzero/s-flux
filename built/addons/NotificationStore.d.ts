import Im = require('immutable');
import BaseStore from './BaseStore';
import shapes = require('../appTypes/shapes');
export interface IFlashNotification {
    baseAction: string;
    type: string;
    id: string;
}
export interface IFlashNotificationEntity extends Im.Map<string, any> {
}
export interface IFlashNotificationEntityList extends Im.List<IFlashNotificationEntity> {
}
export default class NotificationStore extends BaseStore {
    protected IDENTIFIERS: string[];
    protected RELEVANT_ACTIONS: string[];
    protected processHandlerArgs(payload: shapes.IActionPayload, actionName: string): IFlashNotification;
    notifications: IFlashNotificationEntityList;
    /**
     * Implements basic store for storing relevant
     * notifications from BlueprintActions (e.g. USER_CREATE_ERROR, USER_CREATE_SUCCESS,
     * USER_UPDATE_ERROR, USER_UPDATE_SUCCESS, e.t.c.)
     *
     * @constructor
     * @param {Object} dispatcher the dispatcher
     */
    constructor(dispatcher: shapes.IDispatcherInterface);
    parseAction(payload: shapes.IActionPayload, actionName: string): IFlashNotification;
    generateId(): string;
    /**
    * Returns the error based on actionType (e.g. user_create)
    * @public
    * @param {Im.Map} type the found error
    */
    GetByType(type: string): IFlashNotificationEntity;
    /**
     * Returns all the notifications from this store
     * @public
     * @return {Im.List}           the list of notifications
     */
    GetAll(): IFlashNotificationEntityList;
    static getHandlers(): shapes.IStoreDispatcher;
}
