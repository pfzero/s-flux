'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var debug = require('debug');
var Im = require('immutable');
var constants = require('../constants');
var BaseStore_1 = require('./BaseStore');
var Backup_1 = require('./Backup');
var storeDebug = debug('app:flux:Stores:BlueprintStore');
var DispatchHandlers = (function () {
    function DispatchHandlers() {
    }
    /**
     * Create() is the dispatcher for ResourceName_CREATE_SUCCESS;
     *
     * it takes the response from server, it transforms it to immutable
     * Map, and adds it to the list of entities;
     *
     * @param {Object} payload {
     *                         		// the data used to create
     *                         		// the resource
     *                         		givenInput: [resourceData],
     *
     * 								//
     * 								res: {parsed version of the response from server}
     *                         }
     */
    DispatchHandlers.Create = function (storeInstance, payload) {
        var resource = payload.res.data, imResource = Im.fromJS(resource), newCollection = storeInstance.GetAll().push(imResource);
        storeInstance.entities = newCollection;
        storeInstance.emitChangeAsync();
    };
    ;
    /**
     * Update() is the dispatcher for ResourceName_UPDATE_SUCCESS;
     *
     * it updates "again" the collection of entities with the data received
     * from server. The first update is performed in optimisticUpdate, below;
     * also, it removes the oldItem from backup collection
     *
     * @param {Object} payload {
     *                         		// the entity's id and data used to update
     *                         		givenInput: [resourceId, resourceData],
     *
     * 								// the parsed version of response from server
     * 								res: {}
     *                         }
     */
    DispatchHandlers.Update = function (storeInstance, payload) {
        var resource = payload.res.data, imResource = Im.fromJS(resource), resourceId = payload.givenInput[0], oldResourceIndex = storeInstance.GetAll().findIndex(function (item) {
            return item.get('id') === resourceId;
        }), oldCollection = storeInstance.GetAll(), newCollection;
        // add to list if not found
        if (oldResourceIndex === -1) {
            newCollection = oldCollection.push(imResource);
        }
        else {
            newCollection = oldCollection.set(oldResourceIndex, imResource);
        }
        storeInstance.backup.Remove(resourceId);
        storeInstance.entities = newCollection;
        storeInstance.emitChangeAsync();
    };
    ;
    /**
     * UpdateOptimistic is the dispatcher for ResourceName_UPDATE
     *
     * it performs the optimistic updates on the resource within this
     * collection; Also, it stores the old version in backup collection
     * for future usage, in case of server error
     *
     * @param {Object} payload {
     *                         		// entity's id and data to update
     *                         		givenInput: [resourceId, resourceData]
     *                         }
     */
    DispatchHandlers.UpdateOptimistic = function (storeInstance, payload) {
        var resourceId = payload.givenInput[0], changes = payload.givenInput[1], oldResource = storeInstance.GetById(resourceId), oldResourceIndex = storeInstance.GetAll().findIndex(function (item) {
            return item.get('id') === resourceId;
        }), newResource, newCollection;
        // no resource found in the store
        // so nothing to update.
        if (oldResourceIndex === -1) {
            return;
        }
        // set the changes onto the old entity
        newResource = oldResource.merge(changes);
        // modify the collection with the new value
        newCollection = storeInstance.GetAll().set(oldResourceIndex, newResource);
        // add the old entity in the backup store
        storeInstance.backup.Add(oldResource.get('id'), oldResource);
        // change the entites within the store
        storeInstance.entities = newCollection;
        storeInstance.emitChangeAsync();
    };
    /**
     * UpdateError is the dispatcher for ResourceName_UPDATE_ERROR
     *
     * it takes the backup version of the entity, and reverts the
     * updated value via OptimisticUpdate;
     * it also clears the backup value;
     *
     * @param {Object} payload {
     *                         		// entity's id and data used to update
     *                         		givenInput: [resourceId, resourceData],
     *
     * 								// server response with the update failure
     * 								// reason
     *                         		err: {}
     *                         }
     */
    DispatchHandlers.UpdateError = function (storeInstance, payload) {
        var resourceId = payload.givenInput[0], backupResource = storeInstance.backup.Get(resourceId), updatedIndex = storeInstance.GetAll().findIndex(function (item) {
            return item.get('id') === resourceId;
        }), oldCollection = storeInstance.GetAll(), newCollection;
        // if no backup was found
        // nothing to do
        if (!backupResource) {
            return;
        }
        // add the item from backup in the new set
        newCollection = oldCollection.set(updatedIndex, backupResource);
        // removed the item from backup store
        storeInstance.backup.Remove(resourceId);
        storeInstance.entities = newCollection;
        storeInstance.emitChangeAsync();
    };
    ;
    /**
     * GetById is the action handler for ResourceName_GETBYID_SUCCESS
     *
     * this handler will search for the value in existing list of entities first;
     * if found, it will replace it, otherwise it will append to list;
     *
     * @param {Object} payload {
     *                         		res: { response from server },
     *                         		givenInput: [resourceId]
     *                         }
     */
    DispatchHandlers.GetById = function (storeInstance, payload) {
        var resourceId = payload.givenInput[0], data = payload.res.data, imResource = Im.fromJS(data), existingIndex = storeInstance.GetAll().findIndex(function (item) {
            return item.get('id') === resourceId;
        }), oldCollection = storeInstance.GetAll(), newCollection;
        // just add
        if (existingIndex === -1) {
            newCollection = oldCollection.push(imResource);
        }
        else {
            newCollection = oldCollection.set(existingIndex, imResource);
        }
        storeInstance.entities = newCollection;
        storeInstance.emitChangeAsync();
    };
    ;
    /**
     * GetBy is the action handler for ResourceName_GETBY_SUCCESS
     *
     * this handler iterates the received entities from the server, searches
     * them in the existing collection and updates the collection by either
     * replacing the old version, or appending the new value; Thus,
     * no duplicates will be found in the list
     *
     * @param {Object} payload {
     *                         		res: { response from server },
     *                         		givenInput: [searchedFieldsObject]
     *                         }
     */
    DispatchHandlers.GetBy = function (storeInstance, payload) {
        var data = payload.res.data, imList = Im.List(Im.fromJS(data)), oldCollection = storeInstance.GetAll();
        imList.forEach(function (item) {
            var id = item.get('id'), existingIndex = oldCollection.findIndex(function (oldItem) {
                return oldItem.get('id') === id;
            });
            // push if not found
            if (existingIndex === -1) {
                oldCollection = oldCollection.push(item);
            }
            else {
                oldCollection = oldCollection.set(existingIndex, item);
            }
        });
        // update existing entities
        storeInstance.entities = oldCollection;
        storeInstance.emitChangeAsync();
    };
    ;
    /**
     * Delete is the action handler for ResourceName_DELETE_SUCCESS
     *
     * the deletion is performed optimistically, so this function
     * only clears the backup-ed value;
     *
     * @param {Object} payload {
     *                         		// entity's id to delete
     *                         		givenInput: [resourceId]
     *                         }
     */
    DispatchHandlers.Delete = function (storeInstance, payload) {
        var resourceId = payload.givenInput[0];
        // just clear the backup
        storeInstance.backup.Remove(resourceId);
    };
    ;
    /**
     * DeleteOptimistic is the action handler for ResourceName_DELETE
     *
     * this will remove the entity with the given id from collection;
     * the found item to be removed, will be stored in the backup collection
     * for future usage, if the server returns an error and the deletion has
     * failed on server;
     *
     * @param {Object} payload {
     *                         		// entity's id to delete
     *                         		givenInput: [resourceId]
     *                         }
     */
    DispatchHandlers.DeleteOptimistic = function (storeInstance, payload) {
        var resourceId = payload.givenInput[0], resource = storeInstance.GetById(resourceId), index = storeInstance.GetAll().findIndex(function (item) {
            return item.get('id') === resourceId;
        }), oldCollection = storeInstance.GetAll();
        var newCollection;
        // nothing found in store
        // nothing to do
        if (index === -1) {
            return;
        }
        // store old item in backup
        storeInstance.backup.Add(resourceId, {
            resource: resource,
            index: index
        });
        // remove the item from collection
        newCollection = oldCollection.delete(index);
        storeInstance.entities = newCollection;
        storeInstance.emitChangeAsync();
    };
    ;
    /**
     * DeleteError is the action handler for ResourceName_DELETE_ERROR
     *
     * it will revert the deleted item via DeleteOptimistic;
     * it will remove the value from backup list;
     *
     * @param {Object} payload **SAME AS DeleteOptimistic from above**
     */
    DispatchHandlers.DeleteError = function (storeInstance, payload) {
        var resourceId = payload.givenInput[0], bk = storeInstance.backup.Get(resourceId), oldCollection = storeInstance.GetAll();
        var newCollection;
        // if the item not found in
        // backup (i.e. the item was not found in the store
        // first time), do nothing
        if (!bk) {
            return;
        }
        // add back the item to the exact
        // same position in the list
        newCollection = oldCollection.splice(bk.index, 0, bk.resource);
        storeInstance.entities = newCollection;
        // clean the backup
        storeInstance.backup.Remove(resourceId);
        // done
        storeInstance.emitChangeAsync();
    };
    ;
    /**
     * Find is the action handler for the action ResourceName_FIND_SUCCESS
     *
     * this handler stores the results in a separate list, which will be
     * overwritten everytime a search is performed;
     *
     * @param {Object} payload {
     *                         		givenInput: [queryObject],
     *
     * 								// the parsed list with found items
     * 								// from server
     *                         		res: {}
     *                         }
     */
    DispatchHandlers.Find = function (storeInstance, payload) {
        var data = payload.res.data, imList = Im.List(Im.fromJS(data));
        storeInstance.lastSearch = imList;
        storeInstance.emitChangeAsync();
    };
    ;
    // no implementations yet on these
    DispatchHandlers.AddTo = function (storeInstance, payload) {
    };
    ;
    DispatchHandlers.Link = function (storeInstance, payload) {
    };
    ;
    DispatchHandlers.Unlink = function (storeInstance, payload) {
    };
    ;
    DispatchHandlers.UnlinkOptimistic = function (storeInstance, payload) {
    };
    ;
    DispatchHandlers.UnlinkError = function (storeInstance, payload) {
    };
    return DispatchHandlers;
})();
exports.DispatchHandlers = DispatchHandlers;
var BlueprintStore = (function (_super) {
    __extends(BlueprintStore, _super);
    function BlueprintStore(dispatcher, opts) {
        _super.call(this, dispatcher);
        this.entities = Im.List();
        this.lastSearch = Im.List();
        this.backup = new Backup_1.default();
        if (opts.resourceName === undefined) {
            throw new TypeError('given resourceName is required and must identify a resource on your server api. (e.g. users)');
        }
        this.resourceName = opts.resourceName.toLowerCase();
    }
    BlueprintStore.prototype.getResourceName = function () {
        return this.resourceName;
    };
    /**
    * dehydrate is the implementation of fluxible interface; It is used
    * to get the serialized state of the store
    *
    * @return {Array} the list of artists needed to transfer to browser
    */
    BlueprintStore.prototype.dehydrate = function () {
        return {
            lastSearch: this.GetLastSearch().toJS(),
            entities: this.GetAll().toJS()
        };
    };
    /**
     * shouldDehydrate is the implementation of the fluxible inteface;
     * it's used as a check if the store should be dehydrated
     * @return {Bool}
     */
    BlueprintStore.prototype.rehydrate = function (state) {
        storeDebug('rehydrating store', state);
        this.lastSearch = Im.List(Im.fromJS(state.lastSearch));
        this.entities = Im.List(Im.fromJS(state.entities));
    };
    BlueprintStore.prototype.getPK = function () {
        return 'id';
    };
    BlueprintStore.prototype.GetAll = function () {
        return this.entities;
    };
    BlueprintStore.prototype.GetById = function (id) {
        var _this = this;
        return this.entities.find(function (entity) {
            return entity.get(_this.getPK()) === id;
        });
    };
    BlueprintStore.prototype.GetBy = function (filterObject) {
        var allItems = this.GetAll(), keys = Object.keys(filterObject || {});
        // perform a filter based on given
        // filterObject        
        return allItems.filter(function (item) {
            var found = true;
            keys.forEach(function (key) {
                if (item.get(key) !== filterObject[key]) {
                    found = false;
                }
            });
            return found;
        });
    };
    BlueprintStore.prototype.GetLastSearch = function () {
        return this.lastSearch;
    };
    BlueprintStore.prototype.GetListByIds = function (ids) {
        if (ids === void 0) { ids = []; }
        var allItems = this.GetAll();
        // filter the items
        return allItems.filter(function (item) {
            return ids.indexOf(item.get('id')) > -1;
        });
    };
    BlueprintStore.getHandlers = function () {
        var resourceName = this.name || this.storeName;
        var create = constants.getActionConstants(resourceName, 'create'), update = constants.getActionConstants(resourceName, 'update'), getById = constants.getActionConstants(resourceName, 'getbyid'), getBy = constants.getActionConstants(resourceName, 'getby'), del = constants.getActionConstants(resourceName, 'delete'), find = constants.getActionConstants(resourceName, 'find'), addTo = constants.getActionConstants(resourceName, 'addTo'), link = constants.getActionConstants(resourceName, 'link'), unlink = constants.getActionConstants(resourceName, 'unlink');
        var handlers = {};
        // create success
        handlers[create.success] = this.actionHandlers.Create;
        // optimistic update
        handlers[update.base] = this.actionHandlers.UpdateOptimistic;
        // successfull update
        handlers[update.success] = this.actionHandlers.Update;
        // revert in case we used optimistic update
        handlers[update.error] = this.actionHandlers.UpdateError;
        // read success
        handlers[getById.success] = this.actionHandlers.GetById;
        // get by fields success
        handlers[getBy.success] = this.actionHandlers.GetBy;
        // optimistic delete
        handlers[del.base] = this.actionHandlers.DeleteOptimistic;
        // successfull delete
        handlers[del.success] = this.actionHandlers.Delete;
        handlers[del.error] = this.actionHandlers.DeleteError;
        // find success
        handlers[find.success] = this.actionHandlers.Find;
        handlers[addTo.success] = this.actionHandlers.AddTo;
        // resource was successfully linked with subresource
        handlers[link.success] = this.actionHandlers.Link;
        // subresource was successfully removed
        handlers[unlink.success] = this.actionHandlers.Unlink;
        return handlers;
    };
    BlueprintStore.actionHandlers = DispatchHandlers;
    return BlueprintStore;
})(BaseStore_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BlueprintStore;
//# sourceMappingURL=BlueprintStore.js.map