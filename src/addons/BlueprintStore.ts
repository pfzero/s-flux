'use strict';


import debug = require('debug');
import Im = require('immutable');
import shapes = require('../appTypes/shapes');
import constants = require('../constants');
import BaseStore from './BaseStore';
import Backup from './Backup';

const storeDebug = debug('app:flux:Stores:BlueprintStore');

export interface IEntity extends Im.Map<string, any> { }
export interface IEntityList extends Im.List<IEntity> { }


export class DispatchHandlers {

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
    public static Create(storeInstance: BlueprintStore, payload: shapes.IActionPayload) {
        const resource = payload.res.data,
            imResource = <IEntity>Im.fromJS(resource),
            newCollection = storeInstance.GetAll().push(imResource);

        storeInstance.entities = newCollection;
        storeInstance.emitChangeAsync();
    };

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
    public static Update(storeInstance: BlueprintStore, payload: shapes.IActionPayload) {
        let resource = payload.res.data,
            imResource = <IEntity>Im.fromJS(resource),
            resourceId = payload.givenInput[0],
            oldResourceIndex = storeInstance.GetAll().findIndex(item => {
                return item.get('id') === resourceId;
            }),
            oldCollection = storeInstance.GetAll(),
            newCollection: IEntityList;

        // add to list if not found
        if (oldResourceIndex === -1) {
            newCollection = oldCollection.push(imResource);
        }    
        
        // update the existing item
        else {
            newCollection = oldCollection.set(oldResourceIndex, imResource);
        }

        storeInstance.backup.Remove(resourceId);
        storeInstance.entities = newCollection;
        storeInstance.emitChangeAsync();
    };

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
    public static UpdateOptimistic(storeInstance: BlueprintStore, payload: shapes.IActionPayload) {
        let resourceId = payload.givenInput[0],
            changes = payload.givenInput[1],
            oldResource = storeInstance.GetById(resourceId),
            oldResourceIndex = storeInstance.GetAll().findIndex(item => {
                return item.get('id') === resourceId;
            }),
            newResource: IEntity,
            newCollection: IEntityList;
            
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
    }
    
    
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
    public static UpdateError(storeInstance: BlueprintStore, payload: shapes.IActionPayload) {

        let resourceId = payload.givenInput[0],
            backupResource = storeInstance.backup.Get(resourceId),
            updatedIndex = storeInstance.GetAll().findIndex(item => {
                return item.get('id') === resourceId;
            }),
            oldCollection = storeInstance.GetAll(),
            newCollection: IEntityList;
            
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
    public static GetById(storeInstance: BlueprintStore, payload: shapes.IActionPayload) {

        let resourceId = payload.givenInput[0],
            data = payload.res.data,
            imResource = Im.fromJS(data),
            existingIndex = storeInstance.GetAll().findIndex(item => {
                return item.get('id') === resourceId;
            }),
            oldCollection = storeInstance.GetAll(),
            newCollection: IEntityList;

        // just add
        if (existingIndex === -1) {
            newCollection = oldCollection.push(imResource);
        }
        // update
        else {
            newCollection = oldCollection.set(existingIndex, imResource);
        }

        storeInstance.entities = newCollection;
        storeInstance.emitChangeAsync();
    };

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
    public static GetBy(storeInstance: BlueprintStore, payload: shapes.IActionPayload) {

        let data = payload.res.data,
            imList = <IEntityList>Im.List(Im.fromJS(data)),
            oldCollection = storeInstance.GetAll();

        imList.forEach(item => {

            const id = item.get('id'),
                existingIndex = oldCollection.findIndex(oldItem => {
                    return oldItem.get('id') === id;
                });
                
            // push if not found
            if (existingIndex === -1) {
                oldCollection = oldCollection.push(item);
            }    
            // update if found
            else {
                oldCollection = oldCollection.set(existingIndex, item);
            }
        });
        
        // update existing entities
        storeInstance.entities = oldCollection;
        storeInstance.emitChangeAsync();
    };
    
    
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
    public static Delete(storeInstance: BlueprintStore, payload: shapes.IActionPayload) {
        const resourceId = payload.givenInput[0];
        // just clear the backup
        storeInstance.backup.Remove(resourceId);
    };
    
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
    public static DeleteOptimistic(storeInstance: BlueprintStore, payload: shapes.IActionPayload) {
        const resourceId = payload.givenInput[0],
            resource = storeInstance.GetById(resourceId),
            index = storeInstance.GetAll().findIndex(item => {
                return item.get('id') === resourceId;
            }),
            oldCollection = storeInstance.GetAll();

        let newCollection: IEntityList;

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
    /**
     * DeleteError is the action handler for ResourceName_DELETE_ERROR
     *
     * it will revert the deleted item via DeleteOptimistic;
     * it will remove the value from backup list;
     *
     * @param {Object} payload **SAME AS DeleteOptimistic from above**
     */
    public static DeleteError(storeInstance: BlueprintStore, payload: shapes.IActionPayload) {

        const resourceId = payload.givenInput[0],
            bk = storeInstance.backup.Get(resourceId),
            oldCollection = storeInstance.GetAll();

        let newCollection: IEntityList;

        // if the item not found in
        // backup (i.e. the item was not found in the store
        // first time), do nothing
        if (!bk) {
            return;
        }

        // add back the item to the exact
        // same position in the list
        newCollection = <IEntityList>oldCollection.splice(bk.index, 0, bk.resource);

        storeInstance.entities = newCollection;

        // clean the backup
        storeInstance.backup.Remove(resourceId);

        // done
        storeInstance.emitChangeAsync();
    };
    
    
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
    public static Find(storeInstance: BlueprintStore, payload: shapes.IActionPayload) {
        const data = payload.res.data,
            imList = <IEntityList>Im.List(Im.fromJS(data));

        storeInstance.lastSearch = imList;

        storeInstance.emitChangeAsync();
    };

    // no implementations yet on these
    public static AddTo(storeInstance: BlueprintStore, payload: shapes.IActionPayload) {
    };
    public static Link(storeInstance: BlueprintStore, payload: shapes.IActionPayload) {
    };
    public static Unlink(storeInstance: BlueprintStore, payload: shapes.IActionPayload) {
    };
    public static UnlinkOptimistic(storeInstance: BlueprintStore, payload: shapes.IActionPayload) {
    };
    public static UnlinkError(storeInstance: BlueprintStore, payload: shapes.IActionPayload) {
    }
}

export default class BlueprintStore extends BaseStore {

    protected resourceName: string;

    public entities: IEntityList = <IEntityList>Im.List();
    public lastSearch: IEntityList = <IEntityList>Im.List();
    public backup: Backup = new Backup();

    constructor(dispatcher: shapes.IDispatcherInterface, opts: shapes.IResourceOptions) {
        super(dispatcher);

        if (opts.resourceName === undefined) {
            throw new TypeError('given resourceName is required and must identify a resource on your server api. (e.g. users)');
        }

        this.resourceName = opts.resourceName.toLowerCase();
    }

    public getResourceName() {
        return this.resourceName;
    }
    
    /**
    * dehydrate is the implementation of fluxible interface; It is used
    * to get the serialized state of the store
    *
    * @return {Array} the list of artists needed to transfer to browser
    */
    dehydrate() {
        return {
            lastSearch: this.GetLastSearch().toJS(),
            entities: this.GetAll().toJS()
        };
    }
    
    
    /**
     * shouldDehydrate is the implementation of the fluxible inteface;
     * it's used as a check if the store should be dehydrated
     * @return {Bool}
     */
    rehydrate(state: any) {
        storeDebug('rehydrating store', state);
        this.lastSearch = <IEntityList>Im.List(Im.fromJS(state.lastSearch));
        this.entities = <IEntityList>Im.List(Im.fromJS(state.entities));
    }

    getPK() {
        return 'id';
    }

    GetAll() {
        return this.entities;
    }

    GetById(id: string) {
        return this.entities.find(entity => {
            return entity.get(this.getPK()) === id;
        });
    }

    GetBy(filterObject: any) {
        const allItems = this.GetAll(),
            keys = Object.keys(filterObject || {});

        // perform a filter based on given
        // filterObject        
        return allItems.filter(item => {
            let found = true;

            keys.forEach(key => {
                if (item.get(key) !== filterObject[key]) {
                    found = false;
                }
            });
            return found;
        });
    }

    GetLastSearch() {
        return this.lastSearch;
    }

    GetListByIds(ids: string[] = []) {
        let allItems = this.GetAll();

        // filter the items
        return allItems.filter(item => {
            return ids.indexOf(item.get('id')) > -1;
        });
    }


    public static name: string;
    public static storeName: string;

    public static actionHandlers = DispatchHandlers;

    public static getHandlers(storeName?: string): shapes.IStoreDispatcher {
        const resourceName = storeName || this.name || this.storeName;

        const create = constants.getActionConstants(resourceName, 'create'),
            update = constants.getActionConstants(resourceName, 'update'),
            getById = constants.getActionConstants(resourceName, 'getbyid'),
            getBy = constants.getActionConstants(resourceName, 'getby'),
            del = constants.getActionConstants(resourceName, 'delete'),
            find = constants.getActionConstants(resourceName, 'find'),
            addTo = constants.getActionConstants(resourceName, 'addTo'),
            link = constants.getActionConstants(resourceName, 'link'),
            unlink = constants.getActionConstants(resourceName, 'unlink');

        const handlers: shapes.IStoreDispatcher = {};

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
    }
}