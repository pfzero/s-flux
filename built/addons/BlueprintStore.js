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
    DispatchHandlers.create = function (storeInstance, payload) {
        var resource = payload.res.data, imResource = Im.fromJS(resource), newCollection = storeInstance.getAll().push(imResource);
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
    DispatchHandlers.update = function (storeInstance, payload) {
        var resource = payload.res.data, imResource = Im.fromJS(resource), resourceId = payload.givenInput[0], oldResourceIndex = storeInstance.getAll().findIndex(function (item) {
            return item.get('id') === resourceId;
        }), oldCollection = storeInstance.getAll(), newCollection;
        // add to list if not found
        if (oldResourceIndex === -1) {
            newCollection = oldCollection.push(imResource);
        }
        else {
            newCollection = oldCollection.set(oldResourceIndex, imResource);
        }
        storeInstance.backup.remove(resourceId);
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
    DispatchHandlers.updateOptimistic = function (storeInstance, payload) {
        var resourceId = payload.givenInput[0], changes = payload.givenInput[1], oldResource = storeInstance.getById(resourceId), oldResourceIndex = storeInstance.getAll().findIndex(function (item) {
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
        newCollection = storeInstance.getAll().set(oldResourceIndex, newResource);
        // add the old entity in the backup store
        storeInstance.backup.add(oldResource.get('id'), oldResource);
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
    DispatchHandlers.updateError = function (storeInstance, payload) {
        var resourceId = payload.givenInput[0], backupResource = storeInstance.backup.get(resourceId), updatedIndex = storeInstance.getAll().findIndex(function (item) {
            return item.get('id') === resourceId;
        }), oldCollection = storeInstance.getAll(), newCollection;
        // if no backup was found
        // nothing to do
        if (!backupResource) {
            return;
        }
        // add the item from backup in the new set
        newCollection = oldCollection.set(updatedIndex, backupResource);
        // removed the item from backup store
        storeInstance.backup.remove(resourceId);
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
    DispatchHandlers.getById = function (storeInstance, payload) {
        var resourceId = payload.givenInput[0], data = payload.res.data, imResource = Im.fromJS(data), existingIndex = storeInstance.getAll().findIndex(function (item) {
            return item.get('id') === resourceId;
        }), oldCollection = storeInstance.getAll(), newCollection;
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
    DispatchHandlers.getBy = function (storeInstance, payload) {
        var data = payload.res.data, imList = Im.List(Im.fromJS(data)), oldCollection = storeInstance.getAll();
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
    DispatchHandlers.delete = function (storeInstance, payload) {
        var resourceId = payload.givenInput[0];
        // just clear the backup
        storeInstance.backup.remove(resourceId);
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
    DispatchHandlers.deleteOptimistic = function (storeInstance, payload) {
        var resourceId = payload.givenInput[0], resource = storeInstance.getById(resourceId), index = storeInstance.getAll().findIndex(function (item) {
            return item.get('id') === resourceId;
        }), oldCollection = storeInstance.getAll();
        var newCollection;
        // nothing found in store
        // nothing to do
        if (index === -1) {
            return;
        }
        // store old item in backup
        storeInstance.backup.add(resourceId, {
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
    DispatchHandlers.deleteError = function (storeInstance, payload) {
        var resourceId = payload.givenInput[0], bk = storeInstance.backup.get(resourceId), oldCollection = storeInstance.getAll();
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
        storeInstance.backup.remove(resourceId);
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
    DispatchHandlers.find = function (storeInstance, payload) {
        var data = payload.res.data, imList = Im.List(Im.fromJS(data));
        storeInstance.lastSearch = imList;
        storeInstance.emitChangeAsync();
    };
    ;
    // no implementations yet on these
    DispatchHandlers.addTo = function (storeInstance, payload) {
    };
    ;
    DispatchHandlers.link = function (storeInstance, payload) {
    };
    ;
    DispatchHandlers.unlink = function (storeInstance, payload) {
    };
    ;
    DispatchHandlers.unlinkOptimistic = function (storeInstance, payload) {
    };
    ;
    DispatchHandlers.unlinkError = function (storeInstance, payload) {
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
            lastSearch: this.getLastSearch().toJS(),
            entities: this.getAll().toJS()
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
    BlueprintStore.prototype.getAll = function () {
        return this.entities;
    };
    BlueprintStore.prototype.getById = function (id) {
        var _this = this;
        return this.entities.find(function (entity) {
            return entity.get(_this.getPK()) === id;
        });
    };
    BlueprintStore.prototype.getBy = function (filterObject) {
        var allItems = this.getAll(), keys = Object.keys(filterObject || {});
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
    BlueprintStore.prototype.getLastSearch = function () {
        return this.lastSearch;
    };
    BlueprintStore.prototype.getListByIds = function (ids) {
        if (ids === void 0) { ids = []; }
        var allItems = this.getAll();
        // filter the items
        return allItems.filter(function (item) {
            return ids.indexOf(item.get('id')) > -1;
        });
    };
    BlueprintStore.getHandlers = function (storeName) {
        var resourceName = storeName || this.name || this.storeName;
        var create = constants.getActionConstants(resourceName, 'create'), update = constants.getActionConstants(resourceName, 'update'), getById = constants.getActionConstants(resourceName, 'getbyid'), getBy = constants.getActionConstants(resourceName, 'getby'), del = constants.getActionConstants(resourceName, 'delete'), find = constants.getActionConstants(resourceName, 'find'), addTo = constants.getActionConstants(resourceName, 'addTo'), link = constants.getActionConstants(resourceName, 'link'), unlink = constants.getActionConstants(resourceName, 'unlink');
        var handlers = {};
        // create success
        handlers[create.success] = this.actionHandlers.create;
        // optimistic update
        handlers[update.base] = this.actionHandlers.updateOptimistic;
        // successfull update
        handlers[update.success] = this.actionHandlers.update;
        // revert in case we used optimistic update
        handlers[update.error] = this.actionHandlers.updateError;
        // read success
        handlers[getById.success] = this.actionHandlers.getById;
        // get by fields success
        handlers[getBy.success] = this.actionHandlers.getBy;
        // optimistic delete
        handlers[del.base] = this.actionHandlers.deleteOptimistic;
        // successfull delete
        handlers[del.success] = this.actionHandlers.delete;
        handlers[del.error] = this.actionHandlers.deleteError;
        // find success
        handlers[find.success] = this.actionHandlers.find;
        handlers[addTo.success] = this.actionHandlers.addTo;
        // resource was successfully linked with subresource
        handlers[link.success] = this.actionHandlers.link;
        // subresource was successfully removed
        handlers[unlink.success] = this.actionHandlers.unlink;
        return handlers;
    };
    BlueprintStore.actionHandlers = DispatchHandlers;
    return BlueprintStore;
})(BaseStore_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BlueprintStore;
//# sourceMappingURL=BlueprintStore.js.map