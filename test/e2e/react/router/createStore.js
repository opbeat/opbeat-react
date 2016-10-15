import { combineReducers, createStore, applyMiddleware } from 'redux'
import { useRouter } from  '../../../../dist/opbeat-react/router'
import { createOpbeatMiddleware } from  '../../../../dist/opbeat-react/redux'
import { routerReducer } from 'react-router-redux'


import reducers from './reducers'
import thunk from 'redux-thunk'

useRouter()


export default function() {
  return createStore(
    combineReducers({
      ...reducers,
      routing: routerReducer
    }),
    applyMiddleware(
      thunk,
      createOpbeatMiddleware(),
    )
  )
}