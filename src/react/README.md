# opbeat-react

This is the official Opbeat module for React, redux and react-router.

## Usage
```js
import initOpbeat from 'opbeat-react'

initOpbeat({
  'orgId': '470e8f31bc7b4f4395143091fe752e8c',
  'appId': '9aac8591cc'
})

// enable react-router instrumentation
import { useRouter } from 'opbeat-react/router'
useRouter()

// enable redux instrumentation using the middleware
// NOTE: make sure you put the opbeat middleware last!
import { createOpbeatMiddleware } from 'opbeat-react/redux'

const store = createStore(
  reducer,
  applyMiddleware(
    thunk,
    createOpbeatMiddleware(),  // make sure this is the last one
  )
)
```

## Using minification?

Install this plugin:
`npm install babel-plugin-add-react-displayname`

This adds `MyComponent.displayName = 'MyComponent'` automatically to compoenents defined in your application.
Remember to add the plugin to your `.babelrc`:
```
plugins: [
  ["babel-plugin-add-react-displayname"]
]
```

## Support

`opbeat-react` works with `react-router` 2.x and `react` 0.14.x and 15.x