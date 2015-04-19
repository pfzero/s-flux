'use strict';

import debug from "debug";
import Im from "immutable";
import BaseStore from 'dispatchr/addons/BaseStore';
import Backup from "./Backup";

let storeDebug = debug("app:flux:Stores:BlueprintStore");


/**
 * getActionConstants returns the 4 type of actions that will
 * dispatch for every action
 * @example
 *     let constants = this.getActionConstants("create");
 *     console.log(constants);
 *     // will print:
 *     {
 *       base: "USERS_CREATE",
 *       success: "USERS_CREATE_SUCCESS",
 *       error: "USERS_CREATE_ERROR",
 *       complete: "USERS_CREATE_COMPLETE"
 *     }
 *
 * @param  {String} type Action type
 * @return {Object}
 */
let getActionConstants = function(resourceName = "", type = "") {

	let upperRsc = resourceName.toUpperCase(),
		upperType = type.toUpperCase();

	return {
		base: upperRsc + "_" + upperType,
		success: upperRsc + "_" + upperType + "_SUCCESS",
		error: upperRsc + "_" + upperType + "_ERROR",
		complete: upperRsc + "_" + upperType + "_COMPLETE"
	};
}


let getHandlers = function(resourceName = "") {
	let create = getActionConstants(resourceName, 'create'),
		update = getActionConstants(resourceName, 'update'),
		getById = getActionConstants(resourceName, 'getbyid'),
		getBy = getActionConstants(resourceName, 'getby'),
		del = getActionConstants(resourceName, 'delete'),
		find = getActionConstants(resourceName, 'find'),
		addTo = getActionConstants(resourceName, 'addTo'),
		link = getActionConstants(resourceName, 'link'),
		unlink = getActionConstants(resourceName, 'unlink');

	let handlers = {},
		dispatchHandlers = getDispatchHandlers();

	// create success
	handlers[create.success] = dispatchHandlers.Create;

	// optimistic update
	handlers[update.base] = dispatchHandlers.UpdateOptimistic;

	// successfull update
	handlers[update.success] = dispatchHandlers.Update;

	// revert in case we used optimistic update
	handlers[update.error] = dispatchHandlers.UpdateError;

	// read success
	handlers[getById.success] = dispatchHandlers.GetById;

	// get by fields success
	handlers[getBy.success] = dispatchHandlers.GetBy;

	// optimistic delete
	handlers[del.base] = dispatchHandlers.DeleteOptimistic;

	// successfull delete
	handlers[del.success] = dispatchHandlers.Delete;

	handlers[del.error] = dispatchHandlers.DeleteError;

	// find success
	handlers[find.success] = dispatchHandlers.Find;

	handlers[addTo.success] = dispatchHandlers.AddTo;

	// resource was successfully linked with subresource
	handlers[link.success] = dispatchHandlers.Link;

	// subresource was successfully removed
	handlers[unlink.success] = dispatchHandlers.Unlink;

	return handlers;
};

let getDispatchHandlers = function() {

	let dispatchHandlersNS = {};

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
	dispatchHandlersNS.Create = function(payload) {
		let resource = payload.res[this.getResourceName()],
			imResource = Im.fromJS(resource),
			newCollection = this.GetAll().add(imResource);

		this.entities = newCollection;

		this.emitChange();
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
	dispatchHandlersNS.Update = function(payload) {
		let resource = payload.res[this.getResourceName()],
			imResource = Im.fromJS(resource),
			[resourceId] = payload.givenInput,
			oldResourceIndex = this.GetAll().findIndex(item => {
				return item.get('id') === resourceId;
			}),
			newCollection = this.GetAll().set(oldResourceIndex, imResource);

		this.backup.Remove(resourceId);

		this.entities = newCollection;

		this.emitChange();
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
	dispatchHandlersNS.UpdateOptimistic = function(payload) {
		let [resourceId, changes] = payload.givenInput,
			oldResource = this.GetById(resourceId),
			oldResourceIndex = this.GetAll().findIndex(item => {
				return item.get('id') === resourceId;
			}),
			newResource,
			newCollection;

		// no resource found in the store
		// so nothing to update.
		if (!oldResource) {
			return;
		}

		newResource = oldResource.merge(changes),
			newCollection = this.GetAll().set(oldResourceIndex, newResource);

		this.backup.Add(oldResource.get('id'), oldResource);

		this.entities = newCollection;

		this.emitChange();
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
	dispatchHandlersNS.UpdateError = function(payload) {
		let [resourceId] = payload.givenInput,
			backupResource = this.backup.Get(resourceId),
			updatedIndex = this.GetAll().findIndex(item => {
				return item.get('id') === resourceId;
			}),
			newCollection = this.GetAll().set(updatedIndex, backupResource);

		this.backup.Remove(resourceId);

		this.entities = newCollection;

		this.emitChange();
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
	dispatchHandlersNS.GetById = function(payload) {
		let [resourceId] = payload.givenInput,
			imResource = Im.fromJS(payload.res[this.getResourceName()]),
			existingIndex = this.GetAll().findIndex(item => {
				return item.get('id') === resourceId;
			});

		let newCollection = this.GetAll().set(existingIndex, imResource);

		this.entities = newCollection;

		this.emitChange();
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
	dispatchHandlersNS.GetBy = function(payload) {
		let imList = Im.List(Im.fromJS(payload.res[this.getResourceName()])),
			newCollection = this.GetAll();

		imList.forEach(item => {
			let id = item.get('id'),
				existingIndex = this.GetAll().findIndex(oldItem => {
					return oldItem.get('id') === id;
				});

			newCollection = newCollection.set(existingIndex, item);
		});

		this.entities = newCollection;

		this.emitChange();
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
	dispatchHandlersNS.Delete = function(payload) {
		let [resourceId] = payload.givenInput;

		// just clear the backup
		this.backup.Remove(resourceId);
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
	dispatchHandlersNS.DeleteOptimistic = function(payload) {
		let [resourceId] = payload.givenInput,
			resource = this.GetById(resourceId),
			index = this.GetAll().findIndex(item => {
				return item.get('id') === resourceId;
			}),
			bk = this.backup.Add(resourceId, {
				resource, index
			}),
			newCollection = this.GetAll().delete(index);

		this.entities = newCollection;

		this.emitChange();
	};

	/**
	 * DeleteError is the action handler for ResourceName_DELETE_ERROR
	 *
	 * it will revert the deleted item via DeleteOptimistic;
	 * it will remove the value from backup list;
	 *
	 * @param {Object} payload **SAME AS DeleteOptimistic from above**
	 */
	dispatchHandlersNS.DeleteError = function(payload) {
		let [resourceId] = payload.givenInput, {
				index, resource
			} = this.backup.Get(resourceId),
			newCollection = this.GetAll().splice(index, 0, resource);

		this.entities = newCollection;

		this.backup.Remove(resourceId);

		this.emitChange();
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
	dispatchHandlersNS.Find = function(payload) {
		let imList = Im.List(Im.fromJS(payload.res[this.getResourceName()]));

		this.lastSearch = imList;

		this.emitChange();
	};

	dispatchHandlersNS.AddTo = function(payload) {};

	dispatchHandlersNS.Link = function(payload) {};

	dispatchHandlersNS.Unlink = function(payload) {};

	dispatchHandlersNS.UnlinkOptimistic = function(payload) {};

	dispatchHandlersNS.UnlinkError = function(payload) {};

	return dispatchHandlersNS;
};

class BlueprintStore extends BaseStore {
	constructor(dispatcher, opts) {
		super(dispatcher);

		if (opts.resourceName === undefined) {
			throw new TypeError("given resourceName is requierd and must identify a resource on your server api. (e.g. users)");
		}

		let resourceName = opts.resourceName;

		this.getResourceName = () => {
			return resourceName;
		}

		this.entities = Im.List();

		this.lastSearch = Im.List();

		this.backup = new Backup();
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
	rehydrate(state) {
		storeDebug('rehydrating store', state);
		this.lastSearch = Im.List(Im.fromJS(state.lastSearch));
		this.entities = Im.List(Im.fromJS(state.entities));
	}

	getPK() {
		return "id"
	}


	GetAll() {
		return this.entities;
	}

	GetById(id) {
		return this.entities.find(entity => {
			return entity.get(this.getPK()) === id;
		});
	}

	GetLastSearch() {
		return this.lastSearch;
	}

	GetListByIds(...ids) {
		let foundItems = [],
			allItems = this.GetAll();

		ids.forEach(id => {
			let it = allItems.find(item => {
				return item.get('id') === id;
			});

			if (it !== undefined) {
				foundItems.push(it);
			}
		});

		return Im.List(foundItems);
	}
}

BlueprintStore.GetHandlers = function(resourceName = "") {
	return getHandlers(resourceName);
};

export default BlueprintStore;