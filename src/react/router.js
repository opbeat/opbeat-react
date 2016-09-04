var patchObject = require('../common/patchUtils').patchObject
var Router = require('react-router').Router

function makeSignatureFromRoutes (routes, location) {
  if (routes.length < 1) {
    return 'unknown'
  }

  var fullRoute = routes[0].path
  for (var i = 1; i < routes.length; i++) {
    if (routes[i].path) {
      fullRoute += (fullRoute[fullRoute.length-1] === '/' && routes[i].path[0] === '/')
                    ? routes[i].path.slice(1) : routes[i].path
    }
  }

  if (location.action === "REPLACE") {
    fullRoute += " (REPLACE)"
  }

  return fullRoute
}

function routeChange (transactionService, state) {
  var fullRoute = makeSignatureFromRoutes(state.routes, state.location)
  transactionService.startTransaction(fullRoute, 'spa.route-change')
}

function useRouter (serviceContainer) {
  patchObject(Router.prototype, 'componentWillMount', function (delegate) {
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

  // react.createClass = function (objSpec) {
  //   console.log("createClass")
  //   if (objSpec.displayName === 'Router') {
  //     var orgCreateRouterObjects = objSpec.createRouterObjects
  //     objSpec.createRouterObjects = function () {
  //     }
  //   }

  //   return origCreateClass(objSpec)
  // }
}

module.exports = {
  useRouter: useRouter,
  makeSignatureFromRoutes: makeSignatureFromRoutes
}
