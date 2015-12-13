import Im = require('immutable');
import BaseStore from './BaseStore';
import shapes = require('../appTypes/shapes');
export interface IProcessedError {
    id: string;
    baseAction: string;
    error: Error | shapes.IParsedResponse;
    userInput: any;
    resourceId?: string;
    subResourceName?: string;
    subResourceId: string;
}
export interface IErrorEntity extends Im.Map<string, any> {
}
export interface IErrorEntityList extends Im.List<IErrorEntity> {
}
export default class ErrorStore extends BaseStore {
    protected ERROR_IDENTIFIER: string;
    protected RELEVANT_ERRORS: string[];
    errors: IErrorEntityList;
    protected processHandlerArgs(payload: shapes.IActionPayload, actionName: string): IProcessedError;
    /**
     * Implements basic store for storing relevant
     * errors from BlueprintActions (e.g. USER_CREATE_ERROR, USER_UPDATE_ERROR, e.t.c.)
     *
     * @constructor
     * @param {Object} dispatcher the dispatcher
     */
    constructor(dispatcher: shapes.IDispatcherInterface);
    parseAction(payload: shapes.IActionPayload, actionName: string): IProcessedError;
    generateId(): string;
    /**
     * Returns the error based on actionType (e.g. user_create)
     * @public
     * @param {Im.Map} type the found error
     */
    GetByType(type: string): IErrorEntity;
    /**
     * Returns all the errors from this store
     * @public
     * @return {Im.List}           the list of errors
     */
    GetAll(): IErrorEntityList;
    static getHandlers(): shapes.IStoreDispatcher;
}
