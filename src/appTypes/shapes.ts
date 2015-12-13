/// <reference path="../../typings/tsd.d.ts"/>

import components = require('./components');
import superagent = require('superagent');

export interface IAppErrorDescription {
	error: string;
	status: number;
	summary: string;
}

export interface IAppErrorMap {
	[errorKey: string]: IAppErrorDescription;
}

export interface IActionType {
	[k: string]: string
}

export interface IUrlQuery {
	[k: string]: string
}

export interface IResourceOptions {
	resourceName: string,
	apiService?: IBlueprintServices
}

export interface IContext {
	dispatch: { (actionName: string, payload: IActionPayload): void }
	getBaseRequest: { (): IRestMethod }
}

export interface IServiceMethod {
	(service: IRestMethod, ...args: any[]): Promise<any>
}

export interface IActionMethod {
	(ctx: IContext, ...params: any[]): Promise<any>
}

export interface IApiService {
	[k: string]: IServiceMethod
}

export interface IActions {
	[actionName: string]: IActionMethod
}

import Promise = require('bluebird');

export interface IBlueprintActions {
	Create: IActionMethod
	GetById: IActionMethod
	GetBy: IActionMethod
	// alias update
	Batch: IActionMethod
	Update: IActionMethod
	Delete: IActionMethod
	Find: IActionMethod
	AddTo: IActionMethod
	Link: IActionMethod
	UnLink: IActionMethod
}

export interface IBlueprintServices {
	Create: IServiceMethod
	Update: IServiceMethod
	Batch: IServiceMethod
	Delete: IServiceMethod
	GetById: IServiceMethod
	GetBy: IServiceMethod
	Find: IServiceMethod
	AddTo: IServiceMethod
	Link: IServiceMethod
	UnLink: IServiceMethod
}

export interface IParsedResponse extends IAppErrorDescription {
	data: Object
	hasError: boolean
}

export interface IActionPayload {
	givenInput?: any[]
	res?: IParsedResponse
	error?: Error | IParsedResponse
}


export interface IStoreDispatcher {
    [actionName: string]: IStoreDispatchFn
}

export interface IStoreClass {
    new (dispatcher: IDispatcherInterface): components.Store
    name?: string
    storeName?: string
    getHandlers(): IStoreDispatcher
}

export interface IStoreMap {
    [storeName: string]: IStoreClass
}

export interface IActionClass {
    new (opts: IResourceOptions): IActions
}

export interface IActionMap {
    [actionGroupName: string]: IActions
}

export interface IStoreDispatchFn {
    (storeInstance: components.Store, payload: IActionPayload, actionName?: string): void
	(storeInstance: components.Store, ...otherArgs: any[]): void
}

export interface IActionDispatcher {
    storeName: string
    handler: IStoreDispatchFn
}

export interface IActionDispatcherMap {
    [actionName: string]: IActionDispatcher[]
}

export interface IRestConfig {
    API_URL: string;
    TIMEOUT: number;
}

export interface IRestMethod {
	(method: string, endpoint: string): superagent.Request<any>
}

export interface IDispatcherOptions {
    config: IRestConfig
    stores?: IStoreClass[]
}


export interface IStoreInstanceMap {
    [storeName: string]: components.Store
}

export interface IDispatcherInterface {
    getContext(): any;
    getStore(storeName: string): components.Store;
    waitFor(stores: string[]): void
}

export interface IDispatcherMap {
    [storeName: string]: IStoreDispatchFn
}
