var reactInternals = require('./reactInternals')
var patchMethod = require('opbeat-js-core').patchUtils.patchMethod
var nodeName = require('./utils').nodeName
var utils = require('./utils')
var isTopLevelWrapper = require('./utils').isTopLevelWrapper

module.exports = function patchReact (reactInternals, serviceContainer) {
  var ReactReconciler = reactInternals.Reconciler
  var ReactMount = reactInternals.Mount
  var ComponentTree = reactInternals.ComponentTree

  var componentRenderPatch = function (delegate) {
    return function (self, args) {
      var out
      if (serviceContainer && args[0] && args[0].getName) {
        var component = args[0]
        var name = component.getName()
        if (
            name === null || isTopLevelWrapper(ReactMount, component._currentElement)
        ) {
          // TopLevelWrapper or null components don't make sense to include here
          return delegate.apply(self, args)
        }

        var renderState = serviceContainer.services.zoneService.get('renderState')
        var trace
        if (!renderState) {
          trace = serviceContainer.services.transactionService.startTrace(name, "template.component");
          serviceContainer.services.zoneService.set('renderState', true)
        }

        out = delegate.apply(self, args)
        
        if(trace) {
          trace.end()
          serviceContainer.services.zoneService.set('renderState', null)
        }

      } else {
        out = delegate.apply(self, args)
      }
      return out
    }
  }

  patchMethod(ReactReconciler, 'mountComponent', componentRenderPatch)
  patchMethod(ReactReconciler, 'receiveComponent', componentRenderPatch)
  patchMethod(ReactReconciler, 'unmountComponent', componentRenderPatch)
  patchMethod(ReactReconciler, 'performUpdateIfNecessary', componentRenderPatch)

  patchMethod(ReactMount, '_renderSubtreeIntoContainer', function (delegate) {
    return function (self, args) {
      if (serviceContainer) {
        var out
        var transactionService = serviceContainer.services.transactionService
        return serviceContainer.services.zoneService.runInOpbeatZone(function () {
          if (!transactionService.metrics['appBeforeBootstrap']) {
            transactionService.metrics['appBeforeBootstrap'] = performance.now()
          }

          out = delegate.apply(self, args)

          if (!transactionService.metrics['appAfterBootstrap']) {
            transactionService.metrics['appAfterBootstrap'] = performance.now()
          }
          transactionService.detectFinish()
          return out
        })
      } else {
        return delegate.apply(self, args)
      }
    }
  })
}
