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
    protected baseAction(action: string, ctx: shapes.IContext, ...givenInput: Array<any>): Promise<void>;
    create(ctx: shapes.IContext, resourceData: any, query?: any): Promise<void>;
    getById(ctx: shapes.IContext, resourceId: string, query?: string): Promise<void>;
    getBy(ctx: shapes.IContext, fields?: any, query?: any): Promise<void>;
    batch(ctx: shapes.IContext, resourceId: string, resourceData: any, query: any): Promise<void>;
    update(ctx: shapes.IContext, resourceId: string, resourceData: any, query: any): Promise<void>;
    delete(ctx: shapes.IContext, resourceId: string, query?: string): Promise<void>;
    find(ctx: shapes.IContext, query: any): Promise<void>;
    addTo(ctx: shapes.IContext, resourceId: string, subResourceName: string, subResourceData: any, query: any): Promise<void>;
    link(ctx: shapes.IContext, resourceId: string, subResourceName: string, subResourceId: string, query: any): Promise<void>;
    unLink(ctx: shapes.IContext, resourceId: string, subResourceName: string, subResourceId: string, query: any): Promise<void>;
}
export default BlueprintAction;
