
import debug = require('debug');
import Promise = require('bluebird');
import request = require('superagent');
import module = constants;

import {IResourceOptions, IBlueprintActions, IServiceMethod, IApiService, IBlueprintServices, IUrlQuery, IParsedResponse} from './types';

const errors = constants.errors;
const blueprintServiceDebug = debug('app:flux:services:BlueprintService');


export class ServiceResponseParser {
    
    // parse server response
    protected static defaultResponseHandler(resolve: Function, reject: Function, err: Error, res: request.Response): void {
        if (err) {
            return reject(this.parseError(err));
        }

        const parsed = this.parseResponse(res);

        if (parsed.hasError) {
            return reject(parsed);
        }

        return resolve(parsed);
    }
    
    // parse query
    protected static parseQuery(query: any): IUrlQuery {
        let parsedQuery: IUrlQuery = {},
            qKeys = Object.keys(query || {});

        qKeys.forEach(searchKey => {
            const searchValue = query[searchKey];
            if (typeof searchValue === 'object') {
                parsedQuery[searchKey] = JSON.stringify(searchValue);
            } else {
                parsedQuery[searchKey] = searchValue;
            }
        });
        return parsedQuery;
    }

    // parse error
    protected static parseError(err: Error) {
        return err;
    }

    // parse server response
    protected static parseResponse(response: request.Response): IParsedResponse {
        let parsed = <IParsedResponse>{};
        
        // success
        if (response.status >= 200 && response.status < 300) {
            parsed.data = response.body;
            parsed.hasError = false;
            parsed.status = response.status;
            return parsed;
        };
        
        // not found
        if (response.notFound) {
            parsed = response.body || errors['E_NOT_FOUND'];
            parsed.hasError = true;
            parsed.summary = !response.body && response.text;
            return parsed;
        }
        
        // bad request
        if (response.badRequest) {
            parsed = response.body || errors['E_BAD_REQUEST'];
            parsed.hasError = true;
            parsed.summary = !response.body && response.text;
            return parsed;
        }
        
        // internal error
        if (response.status === 500) {
            parsed = response.body || errors['E_INTERNAL'];
            parsed.hasError = true;
            parsed.summary = !response.body && response.text;
            return parsed;
        }

        parsed = response.body || errors['E_UNKNOWN'];
        parsed.hasError = true;
        // unknown reasons
        return parsed;
    }
}


export class BlueprintService extends ServiceResponseParser {

    private resourceName: string

    constructor(opts: IResourceOptions) {
        super();

        if (opts.resourceName === undefined) {
            throw new TypeError('Required resourceName is missing! The resourceName is required when making server requests.');
        }
        this.resourceName = opts.resourceName.toLowerCase();
    }

    protected getResourceName(): string {
        return this.resourceName;
    }

    protected getPK() {
        return 'id';
    }

    Create(request: request.SuperAgentStatic, data: any, query: any) {
        const parsedQuery = BlueprintService.parseQuery(query);
        return new Promise((resolve, reject) => {
            request('POST', this.getResourceName()).send(data).query(parsedQuery).end(BlueprintService.defaultResponseHandler.bind(this, resolve, reject));
        });
    }
    Update(request: request.SuperAgentStatic, resourceId: string, data: any, query: any) {
        const uri = `${ this.getResourceName() }/${ resourceId }`,
            parsedQuery = BlueprintService.parseQuery(query);

        return new Promise((resolve, reject) => {
            request('PUT', uri).send(data).query(parsedQuery).end(BlueprintService.defaultResponseHandler.bind(this, resolve, reject));
        });
    }
    
    // alias Update
    Batch(request: request.SuperAgentStatic, resourceId: string, data: any, query: any) {
        return this.Update(request, resourceId, data, query);
    }

    Delete(request: request.SuperAgentStatic, resourceId: string, query: any) {
        const uri = `${ this.getResourceName() }/${ resourceId }`,
            parsedQuery = BlueprintService.parseQuery(query);

        return new Promise((resolve, reject) => {
            request('DELETE', uri).query(parsedQuery).end(BlueprintService.defaultResponseHandler.bind(this, resolve, reject));
        });
    }
    GetById(request: request.SuperAgentStatic, resourceId: string, query: any) {
        const uri = `${ this.getResourceName() }/${ resourceId }`,
            parsedQuery = BlueprintService.parseQuery(query);

        return new Promise((resolve, reject) => {
            request('GET', uri).query(query).end(BlueprintService.defaultResponseHandler.bind(this, resolve, reject));
        });
    }

    GetBy(request: request.SuperAgentStatic, fields: Object, query: any) {
        return this.Find(request, fields, query);
    }

    Find(request: request.SuperAgentStatic, criteria: any = {}, query: any = {}) {

        var complexCriteria = query;

        complexCriteria.where = criteria;

        var parsedQuery = BlueprintService.parseQuery(complexCriteria);

        return new Promise((resolve, reject) => {
            request("GET", this.getResourceName())
                .query(parsedQuery)
                .end(BlueprintService.defaultResponseHandler.bind(this, resolve, reject));
        });
    }

    AddTo(request: request.SuperAgentStatic, resourceId: string, subResource: string, subResourceData: any, query: any) {
        const uri = `${ this.getResourceName() }/${ resourceId }/${ subResource }`,
            parsedQuery = BlueprintService.parseQuery(query);

        return new Promise((resolve, reject) => {
            request('POST', uri).send(subResourceData).query(parsedQuery).end(BlueprintService.defaultResponseHandler.bind(this, resolve, reject));
        });
    }

    Link(request: request.SuperAgentStatic, resourceId: string, subResource: string, subResourceId: string, query: any) {
        const uri = `${ this.getResourceName() }/${ resourceId }/${ subResource }/${ subResourceId }`,
            parsedQuery = BlueprintService.parseQuery(query);

        return new Promise((resolve, reject) => {
            request('GET', uri).query(parsedQuery).end(BlueprintService.defaultResponseHandler.bind(this, resolve, reject));
        });
    }

    UnLink(request: request.SuperAgentStatic, resourceId: string, subResource: string, subResourceId: string, query: any) {
        const uri = `${ this.getResourceName() }/${ resourceId }/${ subResource }/${ subResourceId }`,
            parsedQuery = BlueprintService.parseQuery(query);

        return new Promise((resolve, reject) => {
            request('DELETE', uri).query(parsedQuery).end(BlueprintService.defaultResponseHandler.bind(this, resolve, reject));
        });
    }
}