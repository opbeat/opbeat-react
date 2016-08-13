var ReactUpdates = require('react/lib/ReactUpdates')
var ReactReconciler = require('react/lib/ReactReconciler')
var patchMethod = require('../../common/patchUtils').patchMethod

var reactDom = require('react-dom')

module.exports = function patchReact (serviceContainer) {
  var batchedUpdatePatch = function (delegate) {
    return function (self, args) {
      var ret
      try {
        serviceContainer.services.zoneService.set('componentsRendered', [])
        var tr = serviceContainer.services.transactionService.startTrace('batchedUpdates', 'template.update')
        ret = delegate.apply(self, args)
        tr.signature = 'Render ' + serviceContainer.services.zoneService.get('componentsRendered').length + ' components'
        tr.end()
      } finally {
        serviceContainer.services.zoneService.set('componentsRendered', [])
      }
      return ret
    }
  }
  patchMethod(ReactUpdates, 'batchedUpdates', batchedUpdatePatch)
  patchMethod(ReactUpdates, 'ReactDefaultBatchingStrategy', batchedUpdatePatch)

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
