# Dispatchr with Flux addons 

A [Flux](http://facebook.github.io/flux/docs/overview.html) dispatcher for applications that run on the server and the client.

The package also contains store skeletons for communicating with RESTfull webservices - e.g. [sailsjs](http://github.com/balderdashy/sails).

```js
// in UserActions.js
// create user actions
import BlueprintAction from 'sflux/built/addons/BlueprintAction';

class UserAction extends BlueprintAction {
    constructor() {
        let resourceName = 'Award';
        super({
            resourceName
        });
    }
}

export default UserAction;
```

```js
// in UserActions.js
// create store for users
import BlueprintStore from 'sflux/addons/BlueprintStore';

class UserStore extends BlueprintStore {

    constructor(dispatcher) {
        super(dispatcher, {
            resourceName: 'user'
        });
    }
}

UserStore.storeName = 'UserStore';

// should return a map of the following form:
/*
 * {
 *     'USER_CREATE_SUCCESS': function(storeInstance, payload) {
 * 			let data = payload.res.data,
 * 				imData = immutable.fromJs(data);
 * 			
 * 			let newCollection = storeInstance.entities.push(imData);
 * 			storeInstance.entities = newCollection;
 * 			storeInstance.emitChangeAsync();
 * 		}
 * }
 */

UserStore.getHandlers = function() {
	let bluePrintHandlers = BlueprintStore.getHandlers();
	// blueprintHandlers includes already handlers for: `ResourceName_CREATE_SUCCESS`, `ResourceName_GETBYID_SUCCESS`, `ResourceName_GETBY_SUCCESS`, 
	// `ResourceName_UPDATE_SUCCESS`, `ResourceName_DELETE_SUCCESS`
	return bluePrintHandlers;
}

export default UserStore;
```

```js
// in index.js

// stores && actions
import UserStore from './UserStore';
import UserActions from './UserActions';

import Dispatchr from 'sflux';

let appDispatcher = new Dispatcher({
    config: {
        // http calls timeout
        TIMEOUT: 20000,
        // http calls namespace
        API_URL: '/api'
    }
});

// and then register stores and actions
appDispatcher.registerStore(UserStore);
appDispatcher.registerActions('UserActions', UserActions);

export default appDispatcher;
```

```js
// and then use on client(browser) side or server(node) side;

import appDispatcher from 'path/to/fluxFolder';

// if server side, pass context object with [express]("https://github.com/strongloop/express") request object
// so to copy the cookie header in the superagent request method
let context = appDispatcher.createContext({
    req: expressReq
});


// on client side, use it plain
let context = appDispatcher.createContext();


// and then pass the context object in your react components (or your framework of choice);
// and use it
let UserStoreInstance = context.getStore('UserStore');

let immutableUser = UserStoreInstance.GetById('unique-user-id');

immutableUser.get('id'); // user's id
// etc

// or call actions
let UserActionInstance = context.getStore('UserActions');

UserActionInstance.GetById('user-id-to-fetch-from-server').then(() => {
    let imUser = UserStoreInstance.GetById('user-id-to-fetch'),
        jsonedUser = imUser.toJSON();
    // and use it here... but, a simple store listener should be created and update the whole app when stores changes
});

UserActionInstance.Create({
    'firstname': 'Some',
    'lastname': 'User'
});
```