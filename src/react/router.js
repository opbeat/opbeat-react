var patchObject = require('../common/patchUtils').patchObject
var Router = require('react-router').Router
var utils = require('../lib/utils')

function combineRoutes (routes) {
  var pathParts = []
  var combinedRoute

  for (var i = 0; i < routes.length; i++) {
    if (routes[i].path) {
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

function routeChange (transactionService, state) {
  var fullRoute = makeSignatureFromRoutes(state.routes, state.location)

  var transaction = transactionService.getCurrentTransaction()
  if (transaction && transaction.name !== 'ZoneTransaction') {
    transaction.name = fullRoute // set the parametrized route
    transaction.type = 'spa.route-change'
  }
}

function patchRouter (router) {
  patchObject(router, 'componentWillMount', function (delegate) {
    return function (self, args) {
      if (self.props && self.props.history && self.props.history.listen) {
        self.props.history.listen(function(location) {
          var serviceContainer = utils.opbeatGlobal()
          if (serviceContainer) {
            var transactionService = serviceContainer.services.transactionService
            var transaction = transactionService.getCurrentTransaction()
            if (transaction && transaction.name !== 'ZoneTransaction') {
              transaction.end()
            }

            transactionService.startTransaction(location.pathname, 'spa.route-change.concrete-route')
          }
        })
      }

      patchObject(self, 'createRouterObjects', function (delegate) {
        return function (self, args) {
          var out = delegate.apply(self, args)
          patchObject(out.transitionManager, 'listen', function (delegate) {
            return function (self, args) {
              if (args.length === 1) {
                return delegate.call(self, function () {
                  if (arguments.length === 2) { // error, nextState
                    if (utils.opbeatGlobal()) {
                      // pass through
                      routeChange(utils.opbeatGlobal().services.transactionService, arguments[1]) 
                    }
                  }
                  return args[0].apply(self, arguments)
                })
              }
            }
          })
          return out
        }
      })

      var out = delegate.apply(self, args)
      return out
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
