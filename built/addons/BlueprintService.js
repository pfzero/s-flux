var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var debug = require('debug');
var Promise = require('bluebird');
var constants = require('../constants');
var errors = constants.errors;
var blueprintServiceDebug = debug('app:flux:services:BlueprintService');
var ServiceResponseParser = (function () {
    function ServiceResponseParser() {
    }
    // parse server response
    ServiceResponseParser.prototype.defaultResponseHandler = function (resolve, reject, err, res) {
        if (err) {
            return reject(this.parseError(err));
        }
        var parsed = this.parseResponse(res);
        if (parsed.hasError) {
            return reject(parsed);
        }
        return resolve(parsed);
    };
    // parse query
    ServiceResponseParser.prototype.parseQuery = function (query) {
        var parsedQuery = {}, qKeys = Object.keys(query || {});
        qKeys.forEach(function (searchKey) {
            var searchValue = query[searchKey];
            if (typeof searchValue === 'object') {
                parsedQuery[searchKey] = JSON.stringify(searchValue);
            }
            else {
                parsedQuery[searchKey] = searchValue;
            }
        });
        return parsedQuery;
    };
    // parse error
    ServiceResponseParser.prototype.parseError = function (err) {
        return err;
    };
    // parse server response
    ServiceResponseParser.prototype.parseResponse = function (response) {
        var parsed = {};
        // success
        if (response.status >= 200 && response.status < 300) {
            parsed.data = response.body;
            parsed.hasError = false;
            parsed.status = response.status;
            return parsed;
        }
        ;
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
    };
    return ServiceResponseParser;
})();
exports.ServiceResponseParser = ServiceResponseParser;
var BlueprintService = (function (_super) {
    __extends(BlueprintService, _super);
    function BlueprintService(opts) {
        _super.call(this);
        if (opts.resourceName === undefined) {
            throw new TypeError('Required resourceName is missing! The resourceName is required when making server requests.');
        }
        this.resourceName = opts.resourceName.toLowerCase();
    }
    BlueprintService.prototype.getResourceName = function () {
        return this.resourceName;
    };
    BlueprintService.prototype.getPK = function () {
        return 'id';
    };
    BlueprintService.prototype.Create = function (request, data, query) {
        var _this = this;
        var parsedQuery = this.parseQuery(query);
        return new Promise(function (resolve, reject) {
            request('POST', _this.getResourceName()).send(data).query(parsedQuery).end(_this.defaultResponseHandler.bind(_this, resolve, reject));
        });
    };
    BlueprintService.prototype.Update = function (request, resourceId, data, query) {
        var _this = this;
        var uri = this.getResourceName() + "/" + resourceId, parsedQuery = this.parseQuery(query);
        return new Promise(function (resolve, reject) {
            request('PUT', uri).send(data).query(parsedQuery).end(_this.defaultResponseHandler.bind(_this, resolve, reject));
        });
    };
    // alias Update
    BlueprintService.prototype.Batch = function (request, resourceId, data, query) {
        return this.Update(request, resourceId, data, query);
    };
    BlueprintService.prototype.Delete = function (request, resourceId, query) {
        var _this = this;
        var uri = this.getResourceName() + "/" + resourceId, parsedQuery = this.parseQuery(query);
        return new Promise(function (resolve, reject) {
            request('DELETE', uri).query(parsedQuery).end(_this.defaultResponseHandler.bind(_this, resolve, reject));
        });
    };
    BlueprintService.prototype.GetById = function (request, resourceId, query) {
        var _this = this;
        var uri = this.getResourceName() + "/" + resourceId, parsedQuery = this.parseQuery(query);
        return new Promise(function (resolve, reject) {
            request('GET', uri).query(query).end(_this.defaultResponseHandler.bind(_this, resolve, reject));
        });
    };
    BlueprintService.prototype.GetBy = function (request, fields, query) {
        return this.Find(request, fields, query);
    };
    BlueprintService.prototype.Find = function (request, criteria, query) {
        var _this = this;
        if (criteria === void 0) { criteria = {}; }
        if (query === void 0) { query = {}; }
        var complexCriteria = query;
        complexCriteria.where = criteria;
        var parsedQuery = this.parseQuery(complexCriteria);
        return new Promise(function (resolve, reject) {
            request("GET", _this.getResourceName())
                .query(parsedQuery)
                .end(_this.defaultResponseHandler.bind(_this, resolve, reject));
        });
    };
    BlueprintService.prototype.AddTo = function (request, resourceId, subResource, subResourceData, query) {
        var _this = this;
        var uri = this.getResourceName() + "/" + resourceId + "/" + subResource, parsedQuery = this.parseQuery(query);
        return new Promise(function (resolve, reject) {
            request('POST', uri).send(subResourceData).query(parsedQuery).end(_this.defaultResponseHandler.bind(_this, resolve, reject));
        });
    };
    BlueprintService.prototype.Link = function (request, resourceId, subResource, subResourceId, query) {
        var _this = this;
        var uri = this.getResourceName() + "/" + resourceId + "/" + subResource + "/" + subResourceId, parsedQuery = this.parseQuery(query);
        return new Promise(function (resolve, reject) {
            request('GET', uri).query(parsedQuery).end(_this.defaultResponseHandler.bind(_this, resolve, reject));
        });
    };
    BlueprintService.prototype.UnLink = function (request, resourceId, subResource, subResourceId, query) {
        var _this = this;
        var uri = this.getResourceName() + "/" + resourceId + "/" + subResource + "/" + subResourceId, parsedQuery = this.parseQuery(query);
        return new Promise(function (resolve, reject) {
            request('DELETE', uri).query(parsedQuery).end(_this.defaultResponseHandler.bind(_this, resolve, reject));
        });
    };
    return BlueprintService;
})(ServiceResponseParser);
exports.BlueprintService = BlueprintService;
//# sourceMappingURL=BlueprintService.js.map