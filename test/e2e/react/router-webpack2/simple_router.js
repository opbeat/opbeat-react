import '../opbeat-e2e'
import '../../../../dist/opbeat-react/router'

import React from 'react'
import ReactDOM from 'react-dom'

import { Router, browserHistory } from 'react-router'
import routes from './routes'
import createStore from './createStore'
// import { syncHistoryWithStore } from 'react-router-redux'

const store = createStore()
// const history = createMemoryHistory() // syncHistoryWithStore(browserHistory, store)
console.log("MHELLO")

ReactDOM.render(
  <Router routes={routes} history={browserHistory}/>,
  document.getElementById('reactMount')
)