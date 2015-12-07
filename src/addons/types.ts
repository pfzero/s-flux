import request = require('superagent');
import module = constants;

export interface IUrlQuery {
    [k: string]: string
}

export interface IResourceOptions {
    resourceName: string,
    apiService?: IBlueprintServices
}

export interface IContext { }

export interface IServiceMethod {
    (service: request.SuperAgentStatic, ...args: Array<any>): Promise<any>
}

export interface IActionMethod {
    (ctx: IContext, ...params: Array<any>): Promise<any>
}

export interface IApiService {
    [k: string]: IServiceMethod
}

export interface IBlueprintActions {
    Create: IActionMethod
    Update: IActionMethod
    Batch: IActionMethod
    Delete: IActionMethod
    GetById: IActionMethod
    GetBy: IActionMethod
    Find: IActionMethod
    AddTo: IActionMethod
    Link: IActionMethod
    UnLink: IActionMethod
}

export interface IBlueprintServices extends IApiService {
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

export interface IParsedResponse extends constants.IAppErrorDescription {
    data: Object
    hasError: boolean
}

export interface IActionPayload {
    res: IParsedResponse
    givenInput: Array<any>
}