import Promise = require('bluebird');
import request = require('superagent');
import shapes = require('../appTypes/shapes');
export declare class ServiceResponseParser {
    protected defaultResponseHandler(resolve: Function, reject: Function, err: Error, res: request.Response): void;
    protected parseQuery(query: any): shapes.IUrlQuery;
    protected parseError(err: Error): Error;
    protected parseResponse(response: request.Response): shapes.IParsedResponse;
}
export declare class BlueprintService extends ServiceResponseParser implements shapes.IBlueprintServices {
    private resourceName;
    constructor(opts: shapes.IResourceOptions);
    protected getResourceName(): string;
    protected getPK(): string;
    Create(request: shapes.IRestMethod, data: any, query: any): Promise<{}>;
    Update(request: shapes.IRestMethod, resourceId: string, data: any, query: any): Promise<{}>;
    Batch(request: shapes.IRestMethod, resourceId: string, data: any, query: any): Promise<{}>;
    Delete(request: shapes.IRestMethod, resourceId: string, query: any): Promise<{}>;
    GetById(request: shapes.IRestMethod, resourceId: string, query: any): Promise<{}>;
    GetBy(request: shapes.IRestMethod, fields: Object, query: any): Promise<{}>;
    Find(request: shapes.IRestMethod, criteria?: any, query?: any): Promise<{}>;
    AddTo(request: shapes.IRestMethod, resourceId: string, subResource: string, subResourceData: any, query: any): Promise<{}>;
    Link(request: shapes.IRestMethod, resourceId: string, subResource: string, subResourceId: string, query: any): Promise<{}>;
    UnLink(request: shapes.IRestMethod, resourceId: string, subResource: string, subResourceId: string, query: any): Promise<{}>;
}
