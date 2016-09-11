# opbeat-react

This is the official Opbeat module for React, redux and react-router.

## Usage
```js
import initOpbeat from 'opbeat-react'

const opbeat = initOpbeat({
  'orgId': '470e8f31bc7b4f4395143091fe752e8c',
  'appId': '9aac8591cc'
})

// enable react-router instrumentation
import { useRouter } from 'opbeat-react/router'
useRouter(opbeat)

// enable redux instrumentation using the middleware
// NOTE: make sure you put the opbeat middleware last!
import { opbeatMiddleware } from 'opbeat-react/redux'

const store = createStore(
  reducer,
  applyMiddleware(
    thunk,
    opbeatMiddleware(opbeat),  // make sure this is the last one
  )
)
```

## Support

`opbeat-react` works with `react-router` 2.0+ and `react`