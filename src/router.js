var patchObject = require('./utils').patchObject
var getServiceContainer = require('./react').getServiceContainer

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

  return fullRoute
}

function debugLog () {
  var serviceContainer = getServiceContainer()
  if (serviceContainer) serviceContainer.services.logger.debug.apply(this, arguments)
}

var hardNavigation = true

function patchTransitionManager (transitionManager) {
  patchObject(transitionManager, 'listen', function (delegate) {
    var serviceContainer
    return function (self, args) {
      if (args.length === 1) {
        return delegate.call(self, function () {
          if (arguments.length === 2) { // error, nextState
            var state = arguments[1]
            var fullRoute = makeSignatureFromRoutes(state.routes, state.location)
            serviceContainer = getServiceContainer()

            if (serviceContainer) {
              var transaction = serviceContainer.services.transactionService.getCurrentTransaction()
              if (transaction) {
                // set route name
                if (transaction.type === 'route-change') {
                  transaction.name = fullRoute
                }

                if (hardNavigation && transaction.type === 'route-change') {
                  hardNavigation = false
                  transaction.isHardNavigation = true
                }
              } else {
                debugLog('patchTransitionManager: getCurrentTransaction returned ', transaction)
              }
            }
          } else {
            debugLog('patchTransitionManager: arguments: ', arguments)
          }
          return args[0].apply(self, arguments)
        })
      } else {
        debugLog('patchTransitionManager: args: ', args)
      }
    }
  })
}

function startRoute (location) {
  // A new route change happens
  var serviceContainer = getServiceContainer()
  if (!serviceContainer) {
    return
  }

  var transaction = serviceContainer.services.transactionService.getCurrentTransaction()

  if (!transaction) {
    serviceContainer.services.logger.warn("Opbeat: Problem occured in measuring route-change. Make sure opbeat-react is loaded _before_ React. If you're using a vendor bundle, make sure Opbeat is first")
  } else {
    /*
    location.action == push: do a route change
    location.action == replace:
        - interaction ongoing: do nothing. The replace route change is likely just updating the url bar following an interaction
        - route-change ongoing: route change (could be a redirect)
    */
    if ((location && location.action && location.action !== 'REPLACE') || transaction.type !== 'interaction') {
      if (transaction && transaction.type === 'interaction') {
        transaction.name = 'Unknown'
        transaction.type = 'route-change'
      } else {
        serviceContainer.services.transactionService.startTransaction('Unknown', 'route-change')
      }
    } else {
      serviceContainer.services.logger.debug('Skipped startTransaction', location && location.action, transaction && transaction.type)
    }
  }
}

function patchRouter (router) {
  patchObject(router, 'componentWillMount', function (delegate) {
    return function componentWillMountWrapper (self, args) {
      debugLog('componentWillMountWrapper')
      // Get notified as soon as the url changes
      var listener = null
      if (self.props && self.props.history && self.props.history.listen) {
        listener = self.props.history.listen
      } else if (self.props.matchContext && self.props.matchContext.router.listen) {
        listener = self.props.matchContext.router.listen
      }

      if (listener) {
        self._opbeatUnlisten = listener(function (location) {
          startRoute(location)
        })
      } else {
        debugLog('no listener available')
      }

      // Need to patch transition manager to get the matched routes.
      // react-router version 2.0 has 'createRouterObjects'
      if (self.createRouterObjects) {
        patchObject(self, 'createRouterObjects', function (delegate) {
          return function (self, args) {
            var out = delegate.apply(self, args)
            patchTransitionManager(out.transitionManager)
            return out
          }
        })
        debugLog('patched react-router 2')
      } else {
        if (self.props.matchContext && self.props.matchContext.transitionManager) {
          patchTransitionManager(self.props.matchContext.transitionManager)
        } else if (self.createTransitionManager) {
          // react-router version 3.0 has 'createTransitionManager'
          patchObject(self, 'createTransitionManager', function (delegate) {
            return function (self, args) {
              var transitionManager = delegate.apply(self, args)
              patchTransitionManager(transitionManager)
              return transitionManager
            }
          })
        }

        // When mounting, we need to start a ZoneTransaction if not already started.
        startRoute()
        debugLog('patched react-router 3')
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

// Return a new router instead of patching the original
function wrapRouter (Router) {
  patchRouter(Router.prototype)
  return Router
}

module.exports = {
  wrapRouter: wrapRouter,
  makeSignatureFromRoutes: makeSignatureFromRoutes
}
