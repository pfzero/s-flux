
import debug = require('debug');
import Promise = require('bluebird');
import request = require('superagent');

import shapes = require('../appTypes/shapes');
import constants = require('../constants');

const errors = constants.errors;
const blueprintServiceDebug = debug('app:flux:services:BlueprintService');


export class ServiceResponseParser {
    
    // parse server response
    protected defaultResponseHandler(resolve: Function, reject: Function, err: Error, res: request.Response): void {
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
    protected parseQuery(query: any): shapes.IUrlQuery {
        let parsedQuery: shapes.IUrlQuery = {},
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
    protected parseError(err: Error) {
        return err;
    }

    // parse server response
    protected parseResponse(response: request.Response): shapes.IParsedResponse {
        let parsed = <shapes.IParsedResponse>{};
        
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


export class BlueprintService extends ServiceResponseParser implements shapes.IBlueprintServices {

    private resourceName: string

    constructor(opts: shapes.IResourceOptions) {
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

    public create(request: shapes.IRestMethod, data: any, query: any) {
        const parsedQuery = this.parseQuery(query);
        return new Promise((resolve, reject) => {
            request('POST', this.getResourceName()).send(data).query(parsedQuery).end(this.defaultResponseHandler.bind(this, resolve, reject));
        });
    }

    public update(request: shapes.IRestMethod, resourceId: string, data: any, query: any) {
        const uri = `${ this.getResourceName() }/${ resourceId }`,
            parsedQuery = this.parseQuery(query);

        return new Promise((resolve, reject) => {
            request('PUT', uri).send(data).query(parsedQuery).end(this.defaultResponseHandler.bind(this, resolve, reject));
        });
    }
    
    // alias Update
    public batch(request: shapes.IRestMethod, resourceId: string, data: any, query: any) {
        return this.update(request, resourceId, data, query);
    }

    public delete(request: shapes.IRestMethod, resourceId: string, query: any) {
        const uri = `${ this.getResourceName() }/${ resourceId }`,
            parsedQuery = this.parseQuery(query);

        return new Promise((resolve, reject) => {
            request('DELETE', uri).query(parsedQuery).end(this.defaultResponseHandler.bind(this, resolve, reject));
        });
    }
    public getById(request: shapes.IRestMethod, resourceId: string, query: any) {
        const uri = `${ this.getResourceName() }/${ resourceId }`,
            parsedQuery = this.parseQuery(query);

        return new Promise((resolve, reject) => {
            request('GET', uri).query(query).end(this.defaultResponseHandler.bind(this, resolve, reject));
        });
    }

    public getBy(request: shapes.IRestMethod, fields: Object, query: any) {
        return this.find(request, fields, query);
    }

    public find(request: shapes.IRestMethod, criteria: any = {}, query: any = {}) {

        var complexCriteria = query;

        complexCriteria.where = criteria;

        var parsedQuery = this.parseQuery(complexCriteria);

        return new Promise((resolve, reject) => {
            request("GET", this.getResourceName())
                .query(parsedQuery)
                .end(this.defaultResponseHandler.bind(this, resolve, reject));
        });
    }

    public addTo(request: shapes.IRestMethod, resourceId: string, subResource: string, subResourceData: any, query: any) {
        const uri = `${ this.getResourceName() }/${ resourceId }/${ subResource }`,
            parsedQuery = this.parseQuery(query);

        return new Promise((resolve, reject) => {
            request('POST', uri).send(subResourceData).query(parsedQuery).end(this.defaultResponseHandler.bind(this, resolve, reject));
        });
    }

    public link(request: shapes.IRestMethod, resourceId: string, subResource: string, subResourceId: string, query: any) {
        const uri = `${ this.getResourceName() }/${ resourceId }/${ subResource }/${ subResourceId }`,
            parsedQuery = this.parseQuery(query);

        return new Promise((resolve, reject) => {
            request('GET', uri).query(parsedQuery).end(this.defaultResponseHandler.bind(this, resolve, reject));
        });
    }

    public unLink(request: shapes.IRestMethod, resourceId: string, subResource: string, subResourceId: string, query: any) {
        const uri = `${ this.getResourceName() }/${ resourceId }/${ subResource }/${ subResourceId }`,
            parsedQuery = this.parseQuery(query);

        return new Promise((resolve, reject) => {
            request('DELETE', uri).query(parsedQuery).end(this.defaultResponseHandler.bind(this, resolve, reject));
        });
    }
}