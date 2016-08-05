var react = require('react')
var origCreateClass = react.createClass

function patchReactRouter (transactionService) {
  function routeChange (routes) {
    var fullRoute = ''
    for (var i = 0; i < routes.length; i++) {
      if (routes[i].path) {
        fullRoute += routes[i].path
      }
    }

    transactionService.startTransaction(fullRoute, 'spa.route-change')
  }

  react.createClass = function (objSpec) {
    if (objSpec.displayName === 'Router') {
      var orgCreateRouterObjects = objSpec.createRouterObjects
      objSpec.createRouterObjects = function () {
        var out = orgCreateRouterObjects.apply(this, arguments)
        var orgListen = out.transitionManager.listen
        out.transitionManager.listen = function (listener) {
          orgListen(function () {
            if (arguments.length === 2) {
              routeChange(arguments[1].routes)
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

module.exports = patchReactRouter
