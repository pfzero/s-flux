var Promise = require('bluebird'),
    blueprintServiceDebug = require('debug')("app:flux:services:BlueprintService"),

    // various standard errors
    errors = require('../constants/errors'),

    // default response handler
    defaultResponseHandler = function(resolve, reject, err, res) {
        if (err) return reject(this.parseError(err));

        var parsed = this.parseResponse(res);

        if (parsed.hasError) return reject(parsed);

        return resolve(parsed);
    };

function BlueprintService(opts) {
    if (opts.resourceName === undefined) {
        throw new TypeError("Required resourceName is missing! The resourceName is required when making server requests.");
    }

    var resourceName = opts.resourceName.toLowerCase();

    this.getResourceName = function() {
        return resourceName;
    }
}


BlueprintService.prototype.getPK = function() {
    return "id";
}


BlueprintService.prototype.parseError = function(err) {
    return err;
}

BlueprintService.prototype.parseResponse = function(response) {
    var parsed = {};
    console.log("response is: ", response);
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

BlueprintService.prototype.Create = function(request, data) {
    return new Promise(function(resolve, reject) {
        request("POST", this.getResourceName())
            .send(data)
            .end(defaultResponseHandler.bind(this, resolve, reject));
    }.bind(this));
};

BlueprintService.prototype.Update = function(request, resourceId, data) {
    var uri = this.getResourceName() + "/" + resourceId;

    return new Promise(function(resolve, reject) {
        request("PUT", uri)
            .send(data)
            .end(defaultResponseHandler.bind(this, resolve, reject));
    }.bind(this));
};

// alias Update
BlueprintService.prototype.Batch = function(request, resourceId, data) {
    return this.Update(resourceId, data);
};

BlueprintService.prototype.Delete = function(request, resourceId) {
    var uri = this.getResourceName() + "/" + resourceId;

    return new Promise(function(resolve, reject) {
        request("DELETE", uri)
            .end(defaultResponseHandler.bind(this, resolve, reject));
    }.bind(this));
}

BlueprintService.prototype.GetById = function(request, resourceId) {
    var uri = this.getResourceName() + "/" + resourceId;

    return new Promise(function(resolve, reject) {
        request("GET", uri)
            .end(defaultResponseHandler.bind(this, resolve, reject));
    }.bind(this));
}

BlueprintService.prototype.GetBy = function(request, fields) {
    return this.Find(request, fields);
}

BlueprintService.prototype.Find = function(request, query) {
    var parsedQuery = {},
        qKeys = Object.keys(query);

    qKeys.forEach(function(searchKey) {
        var searchValue = query[searchKey];
        if (typeof searchValue === 'object') {
            parsedQuery[searchKey] = JSON.stringify(searchValue);
        } else {
            parsedQuery[searchKey] = searchValue;
        }
    });

    return new Promise(function(resolve, reject) {
        request("GET", this.getResourceName())
            .query(parsedQuery)
            .end(defaultResponseHandler.bind(this, resolve, reject));
    }.bind(this));
}

BlueprintService.prototype.AddTo = function(request, resourceId, subResource, subResourceData) {
    var uri = this.getResourceName() + "/" + resourceId + "/" + subResource;

    return new Promise(function(resolve, reject) {
        request('POST', uri).send(subResourceData).end(defaultResponseHandler.bind(this, resolve, reject));
    }.bind(this));
}

BlueprintService.prototype.Link = function(request, resourceId, subResource, subResourceId) {
    var uri = this.getResourceName() + "/" + resourceId + "/" + subResource + "/" + subResourceId;

    return new Promise(function(resolve, reject) {
        request("GET", uri)
            .end(defaultResponseHandler.bind(this, resolve, reject));
    }.bind(this));
}

BlueprintService.prototype.UnLink = function(request, resourceId, subResource, subResourceId) {
    var uri = this.getResourceName() + "/" + resourceId + "/" + subResource + "/" + subResourceId;

    return new Promise(function(resolve, reject) {
        request("DELETE", uri)
            .end(defaultResponseHandler.bind(this, resolve, reject));
    }.bind(this));
}

module.exports = BlueprintService;