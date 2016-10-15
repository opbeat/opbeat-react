import React from 'react'
import { Route, IndexRoute } from 'react-router' 
import { App, Index, About, UsersIndex, User, Users } from './components' 

module.exports = (
  <Route path="/" component={App}>
    <IndexRoute component={Index}/>
    <Route path="/about" component={About}/>
    <Route path="users" component={Users}>
      <IndexRoute component={UsersIndex}/>
      <Route path=":id" component={User}/>
    </Route>
  </Route>
)