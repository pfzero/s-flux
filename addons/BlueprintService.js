import debug from "debug";
import errors from "../constants/errors"

let BluePrintServiceDebug = debug("app:flux:services:BlueprintService");

let defaultResponseHandler = function(resolve, reject, err, res) {
    if (err) return resolve(err);

    let parsed = this.parseResponse(res);

    if (parsed.hasError) return reject(parsed);

    return resolve(parsed);
};

class BlueprintService {

    constructor(opts = {}) {

        if (opts.resourceName === undefined) {
            throw new TypeError("Required resourceName is missing! The resourceName is required when making server requests.");
        }

        let resourceName = opts.resourceName.toLowerCase();

        this.getResourceName = function() {
            return resourceName;
        }
    }

    getPK() {
        return "id"
    }

    parseResponse(response) {
        let parsed = {};

        // success
        if (response.status >= 200 && response.status < 300) {
            parsed[this.getResourceName()] = response.body;
            return parsed;
        };

        // not found
        if (response.notFound) {
            parsed = errors.E_NOT_FOUND;
            parsed.hasError = true;
            parsed.summary = response.xhr.responseText;
            return parsed;
        }

        // bad request
        if (response.badRequest) {
            parsed = response.body || errors.E_BAD_REQUEST;
            parsed.hasError = true;
            parsed.summary = !response.body && response.xhr.responseText;
            return parsed;
        }

        // internal error
        if (response.status === 500) {
            parsed = response.body || errors.E_INTERNAL;
            parsed.hasError = true;
            return parsed;
        }

        parsed = response.body || errors.E_UNKNOWN;
        parsed.hasError = true;

        // unknown reasons
        return parsed;
    }

    Create(request, data) {
        return new Promise((resolve, reject) => {
            request("POST", this.getResourceName())
                .send(data)
                .end(defaultResponseHandler.bind(this, resolve, reject));
        });
    }

    Update(request, resourceId, data) {

        let uri = this.getResourceName() + "/" + resourceId;

        return new Promise((resolve, reject) => {
            request("PUT", uri)
                .send(data)
                .end(defaultResponseHandler.bind(this, resolve, reject));
        });
    }

    // alias Update
    Patch(request, resourceId, data) {
        return this.Update(resourceId, data);
    }

    Delete(request, resourceId) {
        let uri = this.getResourceName() + "/" + resourceId;

        return new Promise((resolve, reject) => {
            request("DELETE", uri)
                .end(defaultResponseHandler.bind(this, resolve, reject));
        });
    }

    GetById(request, resourceId) {

        let uri = this.getResourceName() + "/" + resourceId;

        return new Promise((resolve, reject) => {
            request("GET", uri)
                .end(defaultResponseHandler.bind(this, resolve, reject));
        });
    }

    GetBy(request, fields) {
        return this.Find(request, fields);
    }

    Find(request, query) {

        let parsedQuery = {},
            qKeys = Object.keys(query);

        qKeys.forEach(function(searchKey) {
            let searchValue = query[searchKey];
            if (typeof searchValue === 'object') {
                parsedQuery[searchKey] = JSON.stringify(searchValue);
            } else {
                parsedQuery[searchKey] = searchValue;
            }
        });

        return new Promise((resolve, reject) => {
            request("GET", this.getResourceName())
                .query(parsedQuery)
                .end(defaultResponseHandler.bind(this, resolve, reject));
        });
    }

    AddTo(request, resourceId, subResource, subResourceData) {

        let uri = this.getResourceName() + "/" + resourceId + "/" + subResource;

        return new Promise((resolve, reject) => {
            request("POST", uri)
                .send(subResourceData)
                .end(defaultResponseHandler.bind(this, resolve, reject));
        });
    }

    Link(request, resourceId, subResource, subResourceId) {
        let uri = this.getResourceName() + "/" + resourceId + "/" + subResource + "/" + subResourceId;

        return new Promise((resolve, reject) => {
            request("GET", uri)
                .end(defaultResponseHandler.bind(this, resolve, reject));
        });
    }

    UnLink(request, resourceId, subResource, subResourceId) {
        let uri = this.getResourceName() + "/" + resourceId + "/" + subResource + "/" + subResourceId;

        return new Promise((resolve, reject) => {
            request("DELETE", uri)
                .end(defaultResponseHandler.bind(this, resolve, reject));
        });
    }
}

export default BlueprintService;