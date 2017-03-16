import '../opbeat-e2e'
import { wrapRouter } from '../../../dist/opbeat-react/router'

import React from 'react'
import ReactDOM from 'react-dom'

import { Router, browserHistory } from 'react-router'
import routes from './routes'
import createStore from './createStore'
import { Provider } from 'react-redux'

const store = createStore()

const WrappedRouter = wrapRouter(Router)

const SillyComponent = () => <div>Hello!</div>


ReactDOM.render(
  <SillyComponent />,
  document.getElementById('reactMount-silly')
)

ReactDOM.render(
  <Provider store={store}>
    <Router routes={routes} history={browserHistory}/>
  </Provider>,
  document.getElementById('reactMount')
)
