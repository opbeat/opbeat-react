var patchObject = require('../common/patchUtils').patchObject
var Router = require('react-router').Router

function makeSignatureFromRoutes(routes) {
  if (routes.length < 1) {
    return "unknown"
  }
  
  var fullRoute = routes[0].path
  for (var i = 1; i < routes.length; i++) {
    if (routes[i].path) {
      fullRoute += (fullRoute[fullRoute.length-1] === '/' && routes[i].path[0] === '/') ?
                    routes[i].path.slice(1) : routes[i].path
    }
  }
  return fullRoute
}


function routeChange (transactionService, routes) {
  var fullRoute = makeSignatureFromRoutes(routes)
  transactionService.startTransaction(fullRoute, 'spa.route-change')
}

function useRouter (serviceContainer) {
  patchObject(Router.prototype, 'componentWillMount', function(delegate) {
    return function (self, args) {
      patchObject(self, 'createRouterObjects', function(delegate) {
        return function (self, args) {
          var out = delegate.apply(self, args)
          var orgListen = out.transitionManager.listen
          out.transitionManager.listen = function (listener) {
            orgListen(function () {
              if (arguments.length === 2) {
                routeChange(serviceContainer.services.transactionService, arguments[1].routes)
              }
              return listener.apply(this, arguments)
            })
          }
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
