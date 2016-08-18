# opbeat-react

This is the official [Opbeat](https://opbeat.com) module for React, redux and react-router.

## Usage
```
import initOpbeat from 'opbeat-react'

const opbeat = initOpbeat({
  'orgId': '470d9f31bc7b4f4395143091fe752e8c',
  'appId': '9aac8591bb'
})

// enable react-router instrumentation
import { useRouer } from 'opbeat-react/router'
useRouter(opbeat)

// enable redux instrumentation
import { wrapStore } from 'opbeat-react/redux'
const store = wrapStore(opbeat, store)
```