# Dispatchr with Flux addons
---

A [Flux](http://facebook.github.io/flux/docs/overview.html) dispatcher for applications that run on the server and the client.

The package also contains store skeletons for communicating with RESTfull webservices - e.g. [sailsjs](http://github.com/balderdashy/sails).
## Installation
---

NodeJS:
```js
npm install --save s-flux
```
## Usage
---
### Creating a service
#### NOTE:
you must create a service ONLY if you want to extend it with additional methods. 
If the provided methods is enough for your application, jump directly to [Creating an action] section.

Services are used to communicate with a RESTfull backend (using [superagent](https://github.com/visionmedia/superagent) for requests)
 
```js
// in /<Flux Folder Name>/UserService.js
// create service for users
import BlueprintService from 'sflux/addons/BlueprintService'

class UserService extends BlueprintService {
    constructor() {
        super({
            resourceName: 'user' // used to compose action constants (eg. USER_CREATE_SUCCESS, USER_UPDATE_ERROR, etc..)
        });
    }
    myCustomServiceMethod(request, payload) {
        return new Promise((resolve, reject) => {
            request('POST', '/my/endpoint')
                .end(this.defaultResponseHandler.bind(this, resolve, reject));
        });
    }
}

export default UserService;

```

### Creating an action
```js
// in /<Flux Folder Name>/UserActions.js
// create user actions
import BlueprintAction from 'sflux/built/addons/BlueprintAction';
// if you have added additional methods to service
import UserService from './UserService';

class UserAction extends BlueprintAction {
    constructor() {
        let resourceName = 'user';
        // if you have added additional methods to service
        let apiService = new UserService();
        super({
            resourceName,
            // if you have added additional methods to service
            apiService
        });
        // use the custom created service method
        // in this case the action constant will be 
        // USER_MYCUSTOMACTION_SUCCESS, USER_MYCUSTOMACTION_ERROR, etc.
        MyCustomAction(context, payload) {
            return super.BaseAction('myCustomServiceMethod', context, payload);
        }
    }
}

export default UserAction;
```

### Creating a store
```js
// in /<Flux Folder Name>/UserStore.js
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
    
    // If you want to add your additional actions it is super simple:
    blueprintHandlers.USER_MYCUSTOMACTION_SUCCESS = (storeInstance, serverPayload) => {
        // voila! your data is in serverPayload;
        // we recommend using immutable.js to store this data.
    }
	return bluePrintHandlers;
}

export default UserStore;
```

### Instantiating the dispatcher and registering stores and actions

```js
// in /<Flux Folder Name>/index.js

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

#### Server side usage example
```js
import appDispatcher from 'path/to/fluxFolder';

expressApp.use((req, res, next) => {
    let context = appDispatcher.createContext({
        req: req
    });
    // render the Application component and pass the context as prop
    ReactDOM.renderToString(<App context = { context } />);
    // using the context object now you can call any action you need
    // Ex in <App> Component`s render() method:
    let UserActionInstance = context.getActions('UserActions');
    
    UserActionInstance.getById(context, 'user-id-to-fetch-from-server').then(() => {
        let imUser = UserStoreInstance.getById('user-id-to-fetch'),
            jsonedUser = imUser.toJSON();
            // and use it here... but, a simple store listener should be created and update the whole app when stores changes
    });
});

```
#### Client side usage example

```js
// in <client entry point>.js

import appDispatcher from 'path/to/fluxFolder';

// on client side, use it plain
let context = appDispatcher.createContext();


// and then pass the context object in your react components (or your framework of choice);
ReactDOM.render(<App context = { context } />);

// and use it
let UserStoreInstance = this.props.context.getStore('UserStore');

let immutableUser = UserStoreInstance.getById('unique-user-id');

immutableUser.get('id'); // user's id
immutableUser.get('name'); // user`s name
// etc.

// or call actions
let UserActionInstance = context.getActions('UserActions');

UserActionInstance.getById(context, 'user-id-to-fetch-from-server').then(() => {
    let imUser = UserStoreInstance.getById('user-id-to-fetch'),
        jsonedUser = imUser.toJSON();
    // and use it here... but, a simple store listener should be created and update the whole app when stores changes
});

UserActionInstance.create({
    'firstname': 'Some',
    'lastname': 'User'
});
```

## API
---
### Actions

These methods are available by default through `BlueprintAction` class:
 
 - `.create(contextObject, payloadObject)` 
 - `.getById(contextObject, uniqueIdString)` 
 - `.getBy(contextObject, fieldsObject)` 
 - `.update(contextObject, uniqueIdString, payloadObject)` 
 - `.delete(contextObject, uniqueIdString)` 
 - `.find(contextObject, queryObject)`
    + more soon ... 

### Services

When you extend `BlueprintService` class your service instance will inherit the following methods
 
 - `.create(contextObject, payloadObject)` => will make a `POST` request to /<API_URL>/<ResourceName>
 - `.getById(contextObject, uniqueIdString)` => will make a `GET` request to /<API_URL>/<ResourceName>/<uniqueId>
 - `.getBy(contextObject, fieldsObject)` => will make a `GET` request to /<API_URL>/<ResourceName>
 - `.update(contextObject, uniqueIdString, payloadObject)` => will make a `POST` request to /<API_URL>/<ResourceName>/<uniqueId>
 - `.delete(contextObject, uniqueIdString)` => will make a `DELETE` request to /<API_URL>/<ResourceName>/<uniqueId>
 - `.find(contextObject, queryObject)` => will make a `GET` request to /<API_URL>/<ResourceName>?<parsedQuery>

 + more soon ...

### Stores

... coming soon

## Licence
---
MIT