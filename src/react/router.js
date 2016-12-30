var patchObject = require('../common/patchUtils').patchObject
var Router = require('react-router').Router
var utils = require('../lib/utils')
var startTransaction = require('./react').startTransaction
var setTransactionName = require('./react').setTransactionName

function combineRoutes (routes) {
  var pathParts = []
  var combinedRoute

  for (var i = 0; i < routes.length; i++) {
    if (routes[i].path && routes[i].path !== '/') {
      pathParts.push(routes[i].path.slice(
        routes[i].path[0] === '/' ? 1 : 0,
        routes[i].path[routes[i].path.length - 1] === '/' ? -1 : routes[i].path.length
        )
      )
    }
  }

  combinedRoute = pathParts.join('/')

  // prepend a / if necessary
  return combinedRoute[0] !== '/' ? '/' + combinedRoute : combinedRoute
}

function makeSignatureFromRoutes (routes, location) {
  if (routes.length < 1) {
    return 'unknown'
  }
  var fullRoute
  if (routes.length === 1) {
    fullRoute = routes[0].path
  } else {
    fullRoute = combineRoutes(routes)
  }

  if (location.action === 'REPLACE') {
    fullRoute += ' (REPLACE)'
  }

  return fullRoute
}

var hardNavigation = true

function patchTransitionManager (transitionManager) {
  patchObject(transitionManager, 'listen', function (delegate) {
      return function (self, args) {
        if (args.length === 1) {
          return delegate.call(self, function () {
            if (arguments.length === 2) { // error, nextState
              if (utils.opbeatGlobal()) {
                var state = arguments[1]
                var fullRoute = makeSignatureFromRoutes(state.routes, state.location)
                var transaction = setTransactionName(fullRoute, 'route-change')

                if (hardNavigation) {
                  hardNavigation = false
                  transaction.wasHardNavigation = true
                }
              }
            }
            return args[0].apply(self, arguments)
          })
        }
      }
    })
}

function patchRouter (router) {
  patchObject(router, 'componentWillMount', function (delegate) {
    return function componentWillMountWrapper (self, args) {
      if (self.props && self.props.history && self.props.history.listen) {
        self._opbeatUnlisten = self.props.history.listen(startTransaction)
      }

      // react-router version 2.0 has 'createRouterObjects'
      if (self.createRouterObjects) {
        patchObject(self, 'createRouterObjects', function (delegate) {
          return function (self, args) {
            var out = delegate.apply(self, args)
            patchTransitionManager(out.transitionManager)
            return out
          }
        })
      }

      // react-router version 3.0 has 'createTransitionManager'
      if (self.createTransitionManager) {
        patchObject(self, 'createTransitionManager', function (delegate) {
          return function (self, args) {
            var transitionManager = delegate.apply(self, args)
            patchTransitionManager(transitionManager)
            return transitionManager
          }
        })

        if (self.props.history) {
          startTransaction()
        }
      }

      var out = delegate.apply(self, args)
      return out
    }
})

  patchObject(router, 'componentWillUnmount', function (delegate) {
    return function (self, args) {
      if (self._opbeatUnlisten) {
        self._opbeatUnlisten()
      }
      return delegate.apply(self, args)
    }
  })
}


patchRouter(Router.prototype)

function useRouter() {
  if (console && console.log) {
    console.log("Opbeat: useRouter is deprecated and no longer needed. Just `import 'opbeat-opbeat/router'")
  }
}

module.exports = {
  useRouter: useRouter,
  makeSignatureFromRoutes: makeSignatureFromRoutes,
}
