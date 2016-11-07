# opbeat-react

This is the official Opbeat module for React, redux and react-router.

opbeat-react will automatically measure route changes and user interactions in your application and instrument components,
AJAX calls, Redux dispatches etc. to give you detailed insights into what kind of experience your users are having.
opbeat-react will also automatically log exceptions to Opbeat.

## Usage

Make sure to import `opbeat-react` before _anything_ else in your application.

```js
import initOpbeat from 'opbeat-react'

initOpbeat({
  orgId: '470e8f31bc7b4f4395143091fe752e8c',
  appId: '9aac8591cc',
});
```

If you use react-router (v2 or v3), import 'opbeat-react/router'

```js
import initOpbeat from 'opbeat-react'
import 'opbeat-react/router' // enable react-router instrumentation

initOpbeat({
  orgId: '470e8f31bc7b4f4395143091fe752e8c',
  appId: '9aac8591cc',
});
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

## Staging and local environments
You should create separate apps on Opbeat for production, staging and local environments. You'll get separate tokens for each app on Opbeat. You can then do something like:

```js
import initOpbeat from 'opbeat-react'
import 'opbeat-react/router' // enable react-router instrumentation

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

For project with Redux, Opbeat will automatically include the content of the store as well as the `type` of the last 10 actions. This can be disabled by setting `redux.actionsCount` and `redux.sendStateOnException` to something falsy in the call to `initOpbeat`.

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

## Using minification?

Install this plugin:
`npm install --save babel-plugin-add-react-displayname`

This adds `MyComponent.displayName = 'MyComponent'` automatically to compoenents defined in your application.
Remember to add the plugin to your `.babelrc` or your webpack configuration:

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