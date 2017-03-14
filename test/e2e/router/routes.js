import React from 'react'
import { Route, IndexRoute } from 'react-router' 
import { App, Index } from './components' 

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
    <Route path="/about1" getComponent={loadComponent(() => System.import('about_components.js') )} />
    <Route path="/about2" getComponent={(nextState, cb) => {
          require.ensure([], function (require) {
          cb(null, [
            require('./about_component').default,
          ])
        })}} />
  </Route>
)
