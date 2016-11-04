import initOpbeat, { setUserContext, setExtraContext } from '../../../../dist/opbeat-react'
import { createOpbeatMiddleware } from '../../../../dist/opbeat-react/redux'
import '../../../../dist/opbeat-react/router'
// Never call `initOpbeat`

import React from 'react'
import ReactDOM from 'react-dom'

import { Router, Route, browserHistory } from 'react-router'
import { createStore, applyMiddleware } from 'redux'
import { routerReducer } from 'react-router-redux'
import thunk from 'redux-thunk'

setUserContext({username: 'ron'})
setExtraContext({feature_flags: ['coffe-booster']})

const store = createStore(
  function(state) { return state },
  applyMiddleware(
    thunk,
    createOpbeatMiddleware()
  )
)

ReactDOM.render(
  <div>
    <Router history={browserHistory}>
      <Route path="*" />
    </Router>
    <button id="hello" onClick={() => store.dispatch({type: "ANYTHING"})}>Click me!</button>
  </div>,
  document.getElementById('reactMount')
)

