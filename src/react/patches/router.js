var react = require('react')
var origCreateClass = react.createClass

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

function patchReactRouter (serviceContainer) {
  react.createClass = function (objSpec) {
    console.log("createClass")
    if (objSpec.displayName === 'Router') {
      var orgCreateRouterObjects = objSpec.createRouterObjects
      objSpec.createRouterObjects = function () {
        var out = orgCreateRouterObjects.apply(this, arguments)
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
    }

    return origCreateClass(objSpec)
  }
}

module.exports = {
  patchReactRouter: patchReactRouter,
  makeSignatureFromRoutes: makeSignatureFromRoutes
}
