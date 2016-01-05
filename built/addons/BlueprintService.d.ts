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
    create(request: shapes.IRestMethod, data: any, query: any): Promise<{}>;
    update(request: shapes.IRestMethod, resourceId: string, data: any, query: any): Promise<{}>;
    batch(request: shapes.IRestMethod, resourceId: string, data: any, query: any): Promise<{}>;
    delete(request: shapes.IRestMethod, resourceId: string, query: any): Promise<{}>;
    getById(request: shapes.IRestMethod, resourceId: string, query: any): Promise<{}>;
    getBy(request: shapes.IRestMethod, fields: Object, query: any): Promise<{}>;
    find(request: shapes.IRestMethod, criteria?: any, query?: any): Promise<{}>;
    addTo(request: shapes.IRestMethod, resourceId: string, subResource: string, subResourceData: any, query: any): Promise<{}>;
    link(request: shapes.IRestMethod, resourceId: string, subResource: string, subResourceId: string, query: any): Promise<{}>;
    unLink(request: shapes.IRestMethod, resourceId: string, subResource: string, subResourceId: string, query: any): Promise<{}>;
}
