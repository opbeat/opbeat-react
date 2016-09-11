var patchObject = require('../common/patchUtils').patchObject
var Router = require('react-router').Router

function combineRoutes(routes) {
  var pathParts = []
  var combinedRoute

  for (var i = 0; i < routes.length; i++) {
    if (routes[i].path) {
      pathParts.push(routes[i].path.slice(
        routes[i].path[0] === '/' ? 1 : 0,
        routes[i].path[routes[i].path.length-1] === '/' ? -1 : routes[i].path.length
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
  
  if(routes.length == 1) {
    fullRoute = routes[0].path
  }else{
    fullRoute = combineRoutes(routes)
  }

  if (location.action === "REPLACE") {
    fullRoute += " (REPLACE)"
  }

  return fullRoute
}

function routeChange (transactionService, state) {
  var fullRoute = makeSignatureFromRoutes(state.routes, state.location)

  // end any transactions currently ongoing
  var transaction = transactionService.getCurrentTransaction()

  if(transaction && transaction.name !== 'ZoneTransaction'){
    transaction.end()
  }

  transactionService.startTransaction(fullRoute, 'spa.route-change')
}

function patchRouter(router, serviceContainer) {
  patchObject(router, 'componentWillMount', function (delegate) {
    return function (self, args) {
      patchObject(self, 'createRouterObjects', function (delegate) {
        return function (self, args) {
          var out = delegate.apply(self, args)
          patchObject(out.transitionManager, 'listen', function (delegate) {
            return function (self, args) {
              if (args.length == 1) {
                return delegate.call(self, function () {
                  if (arguments.length === 2) { // error, nextState
                    routeChange(serviceContainer.services.transactionService, arguments[1])
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

function useRouter (serviceContainer) {
  patchRouter(Router.prototype, serviceContainer)
}

module.exports = {
  useRouter: useRouter,
  makeSignatureFromRoutes: makeSignatureFromRoutes,
  patchRouter: patchRouter
}
