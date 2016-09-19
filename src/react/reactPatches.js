// Order here matters
var ReactDefaultBatchingStrategy = require('react/lib/ReactDefaultBatchingStrategy')
var ReactReconciler = require('react/lib/ReactReconciler')
var ReactInjection = require('react/lib/ReactInjection')
var getEventTarget = require('react/lib/getEventTarget')

var patchMethod = require('../common/patchUtils').patchMethod
var nodeName = require('./utils').nodeName


module.exports = function patchReact (serviceContainer) {
  var transactionService = serviceContainer.services.transactionService
  var batchedUpdatePatch = function (delegate) {
    return function (self, args) {
      var ret
      var trace

      // template rendering
      serviceContainer.services.zoneService.set('componentsRendered', [])
      var batchedUpdatesStart = window.performance.now()

      ret = delegate.apply(self, args)

      if (args[1] && args[1].nativeEvent) {
        var nativeEventTarget = getEventTarget(args[1].nativeEvent)
        if (nativeEventTarget) {
          // We want traces that have already started to go into a transaction
          // named after the event that fired it.

          // If we have not started a transaction through the code
          // invoked by the task, we should do so now.
          // because of ZoneTransactions, any trace started already will be
          // transferred.

          var trans = transactionService.getCurrentTransaction()
          if (trans && trans.name === 'ZoneTransaction') {
            var reactNode = nodeName(nativeEventTarget)
            transactionService.startTransaction(reactNode + ':' + args[1].nativeEvent.type, 'spa.action')
          }
        }
      }

      var components = serviceContainer.services.zoneService.get('componentsRendered')

      if (components.length > 0) {
        trace = serviceContainer.services.transactionService.startTrace('batchedUpdates', 'template.update')
        trace._start = batchedUpdatesStart

        var text = components.length + ' components'
        trace.signature = 'Render ' + text
        trace.end()
      }
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
  patchMethod(ReactReconciler, 'performUpdateIfNecessary', componentRenderPatch)

  var reactDom = require('react-dom')

  patchMethod(reactDom, 'render', function (delegate) {
    return function (self, args) {
      var out
      return serviceContainer.services.zoneService.zone.run(function () {
        out = delegate.apply(self, args)
        // out = traceComponentRendering(serviceContainer, delegate, self, args)
        serviceContainer.services.transactionService.detectFinish()
        return out
      })
    }
  })
}
