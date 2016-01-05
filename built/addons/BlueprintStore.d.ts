import Im = require('immutable');
import shapes = require('../appTypes/shapes');
import BaseStore from './BaseStore';
import Backup from './Backup';
export interface IEntity extends Im.Map<string, any> {
}
export interface IEntityList extends Im.List<IEntity> {
}
export declare class DispatchHandlers {
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
    static create(storeInstance: BlueprintStore, payload: shapes.IActionPayload): void;
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
    static update(storeInstance: BlueprintStore, payload: shapes.IActionPayload): void;
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
    static updateOptimistic(storeInstance: BlueprintStore, payload: shapes.IActionPayload): void;
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
    static updateError(storeInstance: BlueprintStore, payload: shapes.IActionPayload): void;
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
    static getById(storeInstance: BlueprintStore, payload: shapes.IActionPayload): void;
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
    static getBy(storeInstance: BlueprintStore, payload: shapes.IActionPayload): void;
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
    static delete(storeInstance: BlueprintStore, payload: shapes.IActionPayload): void;
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
    static deleteOptimistic(storeInstance: BlueprintStore, payload: shapes.IActionPayload): void;
    /**
     * DeleteError is the action handler for ResourceName_DELETE_ERROR
     *
     * it will revert the deleted item via DeleteOptimistic;
     * it will remove the value from backup list;
     *
     * @param {Object} payload **SAME AS DeleteOptimistic from above**
     */
    static deleteError(storeInstance: BlueprintStore, payload: shapes.IActionPayload): void;
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
    static find(storeInstance: BlueprintStore, payload: shapes.IActionPayload): void;
    static addTo(storeInstance: BlueprintStore, payload: shapes.IActionPayload): void;
    static link(storeInstance: BlueprintStore, payload: shapes.IActionPayload): void;
    static unlink(storeInstance: BlueprintStore, payload: shapes.IActionPayload): void;
    static unlinkOptimistic(storeInstance: BlueprintStore, payload: shapes.IActionPayload): void;
    static unlinkError(storeInstance: BlueprintStore, payload: shapes.IActionPayload): void;
}
export default class BlueprintStore extends BaseStore {
    protected resourceName: string;
    entities: IEntityList;
    lastSearch: IEntityList;
    backup: Backup;
    constructor(dispatcher: shapes.IDispatcherInterface, opts: shapes.IResourceOptions);
    getResourceName(): string;
    /**
    * dehydrate is the implementation of fluxible interface; It is used
    * to get the serialized state of the store
    *
    * @return {Array} the list of artists needed to transfer to browser
    */
    dehydrate(): {
        lastSearch: any;
        entities: any;
    };
    /**
     * shouldDehydrate is the implementation of the fluxible inteface;
     * it's used as a check if the store should be dehydrated
     * @return {Bool}
     */
    rehydrate(state: any): void;
    getPK(): string;
    getAll(): IEntityList;
    getById(id: string): IEntity;
    getBy(filterObject: any): Im.Iterable<number, IEntity>;
    getLastSearch(): IEntityList;
    getListByIds(ids?: string[]): Im.Iterable<number, IEntity>;
    static name: string;
    static storeName: string;
    static actionHandlers: typeof DispatchHandlers;
    static getHandlers(storeName?: string): shapes.IStoreDispatcher;
}
