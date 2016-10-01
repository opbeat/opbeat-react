import '../opbeat-e2e'
import { useRouter } from  '../../../../dist/opbeat-react/router'
import { createOpbeatMiddleware } from  '../../../../dist/opbeat-react/redux'

import React from 'react'
import ReactDOM from 'react-dom'
import { createStore, applyMiddleware, combineReducers } from 'redux'
import thunk from 'redux-thunk'

import { syncHistoryWithStore, routerReducer } from 'react-router-redux'

import { Router, Route, IndexRoute, Link, IndexLink, browserHistory } from 'react-router'

const reducers = {
  state1: (state) => state ? state : {}
}

var store = createStore(
  combineReducers({
    ...reducers,
    routing: routerReducer
  }),
  applyMiddleware(
    thunk,
    createOpbeatMiddleware(),
  )
)

useRouter(window.opbeat)

const history = syncHistoryWithStore(browserHistory, store)

const ACTIVE = { color: 'red' }

const App = ({ children }) => (
  <div>
    <h1>APP!</h1>
    <ul>
      <li><Link      to="/"           activeStyle={ACTIVE}>/</Link></li>
      <li><IndexLink to="/"           activeStyle={ACTIVE}>/ IndexLink</IndexLink></li>

      <li><Link      to="/users"      activeStyle={ACTIVE}>/users</Link></li>
      <li><IndexLink to="/users"      activeStyle={ACTIVE}>/users IndexLink</IndexLink></li>

      <li><Link      to="/users/ryan" activeStyle={ACTIVE}>/users/ryan</Link></li>
      <li><Link      to={{ pathname: '/users/ryan', query: { foo: 'bar' } }}
                                      activeStyle={ACTIVE}>/users/ryan?foo=bar</Link></li>

      <li><Link      to="/about"      activeStyle={ACTIVE}>/about</Link></li>
    </ul>

    {children}
  </div>
)

const Index = () => (
  <div>
    <h2>Index!</h2>
  </div>
)

const Users = ({ children }) => (
  <div>
    <h2>Users</h2>
    {children}
  </div>
)

const UsersIndex = () => (
  <div>
    <h3>UsersIndex</h3>
  </div>
)

const User = ({ params: { id } }) => (
  <div>
    <h3>User {id}</h3>
  </div>
)

const About = () => (
  <div>
    <h2>About</h2>
  </div>
)

ReactDOM.render((
  <Router history={history}>
    <Route path="/" component={App}>
      <IndexRoute component={Index}/>
      <Route path="/about" component={About}/>
      <Route path="users" component={Users}>
        <IndexRoute component={UsersIndex}/>
        <Route path=":id" component={User}/>
      </Route>
    </Route>
  </Router>
), document.getElementById('reactMount'))