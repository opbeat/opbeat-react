# Opbeat for React

[![Build status](https://travis-ci.org/opbeat/opbeat-react.svg?branch=master)](https://travis-ci.org/opbeat/opbeat-react)
<a href="https://opbeat.com" title="Opbeat"><img src="http://opbeat-brand-assets.s3-website-us-east-1.amazonaws.com/svg/logo/logo.svg" align="right" height="25px"></a>

[![Build Status](https://saucelabs.com/browser-matrix/opbeat-react.svg)](https://saucelabs.com/beta/builds/285d40cc9e9d4aa28dcb82eb79e77a45)

This is the official Opbeat module for React, redux and react-router.

`opbeat-react` will automatically measure route changes and user interactions in your application and instrument components,
AJAX calls, Redux dispatches etc. to give you detailed insights into what kind of experience your users are having.
opbeat-react will also automatically log exceptions to Opbeat.

## Usage

Make sure to import `opbeat-react` before _anything_ else in your application.
If you have a _vendor_ bundle that includes `React`, you need to also incluse `opbeat-react` in that bundle - before `React`.

```js
import initOpbeat from 'opbeat-react'

initOpbeat({
  orgId: '470e8f31bc7b4f4395143091fe752e8c',
  appId: '9aac8591cc',
});
```

If you use react-router (v2 or v3), use `wrapRouter` to enable routing instrumentation. See the [transactions api](#transactions-api) for examples without react-router. 

```jsx harmony
import initOpbeat from 'opbeat-react'
import { Router, Route } from 'react-router'
import { wrapRouter } from 'opbeat-react' // enable react-router instrumentation

const OpbeatRouter = wrapRouter(Router)

const Home = () => <h1>Home</h1>

initOpbeat({
  orgId: '470e8f31bc7b4f4395143091fe752e8c',
  appId: '9aac8591cc',
});

ReactDom.render(
  <OpbeatRouter>
    <Route path='/' component={Home} />
  </OpbeatRouter>,
  document.getElementById('react-mount')
);
```

If you're using Redux, add the Opbeat middleware as the last middleware in your chain:

```js
// enable redux instrumentation using the middleware
// NOTE: make sure you put the opbeat middleware last!
import { createOpbeatMiddleware } from 'opbeat-react/redux'

const store = createStore(
  reducer,
  applyMiddleware(
    thunk,
    createOpbeatMiddleware(),  // make sure this is the last one
  ),
);
```

### Configuration

Configuration options can be given to `initOpbeat`:

* `sendStateOnException`: set to false to disable the Store state being included in error reports (default: `true`).
* `actionsCount`: number of recent actions to keep track of and included in error reports (default: `10`).


Example:

```js
initOpbeat({
  orgId: '470e8f31bc7b4f4395143091fe752e8c',
  appId: '9aac8591cc',
  actionsCount: 50,
  sendStateOnException: true
});
```

## Staging and local environments
You should create separate apps on Opbeat for production, staging and local environments. You'll get separate tokens for each app on Opbeat. You can then do something like:

```js
import initOpbeat from 'opbeat-react'

if (process.env.NODE_ENV === 'production') {
  initOpbeat({
    orgId: '470e8f31bc7b4f4395143091fe752e8c',
    appId: '9aac8591cc', // production app id
  });
}else if(process.env.NODE_ENV === 'staging') {
  initOpbeat({
    orgId: '470e8f31bc7b4f4395143091fe752e8c',
    appId: '9aac8591cc', // staging app id
  });
}
// in local environments, don't call initOpbeat
``` 

This requires the webpack plugin `DefinePlugin` to be correctly set up to define `process.env`.

### Set context information

It's often useful to include additional information in performance data and errors logged to Opbeat. You can do this in the following manner:

```js
import { setUserContext, setExtraContext } from 'opbeat-react'

class OfficeStatus extends React.Component {
  componentDidMount() {
    setUserContext({
      id: 19,
      email: 'ron@opbeat.com',
      username: 'roncohen'
    });

    setExtraContext({
      coffeeLevel: 'low',
      milkSolution: 'skim milk',
    });
  }
}
```

For projects with Redux, Opbeat will automatically include the content of the store as well as the `type` of the last 10 actions. This can be disabled by setting `redux.actionsCount` and `redux.sendStateOnException` to something falsy in the call to `initOpbeat`.

### Manual error logging

If you happen to manually `catch` an error, you can send it up to Opbeat like so:

```js
import { captureError } from 'opbeat-react'

try {
  throw new Error('Everything is broken')
} catch (err) {
  captureError(err)
}
```

### Ignore certain routes/actions/interactions

You can use the `ignoreTransactions` configuration option to ignore certain routes, actions or interactions so they don't get sent up to Opbeat. The `ignoreTransactions` option is given to `initOpbeat` along with your regular options. You specify a list of simple strings or regular expressions that are matched against the name of the transaction.

```js
initOpbeat({
  orgId: '470e8f31bc7b4f4395143091fe752e8c',
  appId: '9aac8591cc',
  ignoreTransactions: ['FETCH_CATS', /^Link /]
});
```

*Note:* Any redux actions that match the list are also ignored from "Last actions" in "Extra" that are automatically sent when errors occur.

### Filtering data

Sometimes, you want to filter out sensitive information before it's sent up to our servers. You can do that in the following manner:

```js
import { addFilter } from 'opbeat-react'

addFilter(data => {
  if (data.extra['Store state'].password) {
    delete data.extra['Store state'].password
  }
  return data  // remember to return data
})
```

### Transactions api

In Opbeat, every measurement must be connected to a transaction. Transactions can be route changes, click events etc.

A simple API is exposed to let you set the name of the ongoing transaction and start new transactions.
For example, this can be used to let Opbeat know about route changes even if you're not using a supported router.  


* `startTransaction()`<br>
Call this to let Opbeat know a new transaction has started.
For example, if you're not using a supported router, you can use `startTransaction` to let Opbeat know that a route change has begun.

* `setTransactionName(transactionName, transactionType)`<br>
Set the name of the ongoing transaction to `transactionName`. For route changes, `transactionName` should be the abstract or parametrized route path (`/coffees/:beanID` and not `/coffees/99`).
You must also specify a type. `transactionType` is an arbitrary string, but transactions of the same type are shown together in the Opbeat UI. For route changes, you should use the string `route-change`.
`setTransactionName` will automatically call `startTransaction` if no transaction has been started yet. 
If a transaction is already ongoing, `setTransactionName` will override any name and type previously set.

Example:

This is a Redux middleware that will look for actions of type `route-change-action` and signal Opbeat that a route change is going on. It relies on a magic method `myRouter.matchRoute` to convert a concrete path into the abstract route that we need. 
```js
const reduxTransactionDetector = store => next => action => {
  if (typeof action === 'object' && action.type === 'route-change-action') {
    const abstractRoute = myRouter.matchRoute(action.newLocation)
    setTransactionName(abstractRoute, 'route-change')
  }
  return next(action)
}
```

## Using minification?

Install this plugin:
`npm install --save babel-plugin-add-react-displayname`

This adds `MyComponent.displayName = 'MyComponent'` automatically to compoenents defined in your application.
Remember to add the plugin to your `.babelrc` or your webpack configuration:


<b>Note on 'transform-decorators-legacy' plugin:</b> If you are using `transform-decorators-legacy`, make sure it appears in the list of plugins *after* `add-react-displayname`. 



#### .babelrc:
```
"plugins": [
  ["add-react-displayname"]
]
```

#### webpack.conf:
Look for the `query` key:
```
query: {
  presets: [....],
  plugins: ["add-react-displayname"]
}
```


## Support

`opbeat-react` works with `react-router` 2 and 3 and `react` 0.14.x and 15.x

IE9 and below is not supported. But in general, every modern browser is supported. 

Opbeat will automatically determine if the browser is supported and disable itself if the browser is not supported.

## Development

Tests: `npm run karma`

End to end tests: `./node_modules/.bin/gulp test:e2e:react-run`


<br>Made with ♥️ and ☕️ by Opbeat and our community.
