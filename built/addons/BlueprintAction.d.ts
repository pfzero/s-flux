import Promise = require('bluebird');
import shapes = require('../appTypes/shapes');
declare class BlueprintAction implements shapes.IBlueprintActions {
    private apiService;
    private resourceName;
    /**
     * class constructor;
     * @constructor
     * @param  {Object} opts the constructor params
     *                       {
     *                           resourceName: {
     *                               type: "string",
     *                               required: true
     *                           },
     *
     *                           apiService: {
     *                               type: "BlueprintService",
     *                               defaultsTo: new BlueprintService({resourceName: resourceName})
     *                           }
     *                       }
     */
    constructor(opts: shapes.IResourceOptions);
    private callService(action, service, ...data);
    protected getResourceName(): string;
    protected getApiService(): any;
    protected BaseAction(action: string, ctx: shapes.IContext, ...givenInput: Array<any>): Promise<void>;
    Create(ctx: shapes.IContext, resourceData: any, query?: any): Promise<void>;
    GetById(ctx: shapes.IContext, resourceId: string, query?: string): Promise<void>;
    GetBy(ctx: shapes.IContext, fields?: any, query?: any): Promise<void>;
    Batch(ctx: shapes.IContext, resourceId: string, resourceData: any, query: any): Promise<void>;
    Update(ctx: shapes.IContext, resourceId: string, resourceData: any, query: any): Promise<void>;
    Delete(ctx: shapes.IContext, resourceId: string, query?: string): Promise<void>;
    Find(ctx: shapes.IContext, query: any): Promise<void>;
    AddTo(ctx: shapes.IContext, resourceId: string, subResourceName: string, subResourceData: any, query: any): Promise<void>;
    Link(ctx: shapes.IContext, resourceId: string, subResourceName: string, subResourceId: string, query: any): Promise<void>;
    UnLink(ctx: shapes.IContext, resourceId: string, subResourceName: string, subResourceId: string, query: any): Promise<void>;
}
export default BlueprintAction;
