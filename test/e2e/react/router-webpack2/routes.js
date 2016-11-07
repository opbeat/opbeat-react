import React from 'react'
import { Route, IndexRoute } from 'react-router' 
import { App, Index, UsersIndex, User, Users } from './components' 

function loadComponent(prom) {
  return function(nextState, cb) {
    prom().then((component) => {
      cb(null, component.default)
    })
  }
}

module.exports = (
  <Route path="/" component={App}>
    <IndexRoute component={Index}/>
    <Route path="/about" getComponent={loadComponent(() => System.import('components/About.js') )} />  // async route
    <Route path="users" component={Users}>
      <IndexRoute component={UsersIndex}/>
      <Route path=":id" component={User}/>
    </Route>
  </Route>
)