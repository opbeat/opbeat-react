// Require react-dom early because it will inject the wrong default batching strategy
// We'll inject our own and override later
var reactDom = require('react-dom')

var ReactReconciler = require('react/lib/ReactReconciler')
var patchMethod = require('../common/patchUtils').patchMethod

var ReactDefaultBatchingStrategy = require('react/lib/ReactDefaultBatchingStrategy')
var ReactInjection = require('react/lib/ReactInjection')

module.exports = function patchReact (serviceContainer) {
  var batchedUpdatePatch = function (delegate) {
    return function (self, args) {
      var ret
      serviceContainer.services.zoneService.set('componentsRendered', [])

      var tr = serviceContainer.services.transactionService.startTrace('batchedUpdates', 'template.update')
      ret = delegate.apply(self, args)
      var components = serviceContainer.services.zoneService.get('componentsRendered')
      var text = components.length + ' components'

      tr.signature = 'Render ' + text
      tr.end()
      return ret
    }
  }

  patchMethod(ReactDefaultBatchingStrategy, 'batchedUpdates', batchedUpdatePatch)
  ReactInjection.Updates.injectBatchingStrategy(ReactDefaultBatchingStrategy)

  var componentRenderPatch = function (delegate) {
    return function (self, args) {
      if (args[0] && args[0].getName) {
        var components = serviceContainer.services.zoneService.get('componentsRendered') || []
        components.push(args[0].getName())
      }
      return delegate.apply(self, args)
    }
  }

  patchMethod(ReactReconciler, 'mountComponent', componentRenderPatch)
  patchMethod(ReactReconciler, 'receiveComponent', componentRenderPatch)

  patchMethod(reactDom, 'render', function (delegate) {
    return function (self, args) {
      var out
      serviceContainer.services.zoneService.zone.run(function () {
        out = delegate.apply(self, args)
        serviceContainer.services.transactionService.detectFinish()
      })
      return out
    }
  })
}
