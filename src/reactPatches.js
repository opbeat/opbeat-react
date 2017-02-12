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

  // patchMethod(reactInternals.EventPluginUtils, 'executeDispatchesInOrder', function (delegate) {
  //   // for quick lookup, make this into an object
  //   var eventWhiteList = {}
  //   var serviceContainer
  //   var performanceEnabled
  //   var configWhiteList
  //   var transactionService

  //   return function (self, args) {
  //     if (!serviceContainer) {
  //       serviceContainer = utils.opbeatGlobal()
  //       if (serviceContainer) {
  //         // first time
  //         var configWhiteList = serviceContainer.services.configService.get('performance.eventWhiteList')  || []
  //         configWhiteList.forEach(function (ev) {
  //           eventWhiteList[ev] = 1
  //         })
  //         transactionService = serviceContainer.services.transactionService
  //       }
  //     }

  //     if (serviceContainer && args[0] && args[0]._dispatchListeners && args[0].nativeEvent) {
  //       var nativeEventTarget = reactInternals.getEventTarget(args[0].nativeEvent)
  //       if (nativeEventTarget) {
  //         // We want traces that have already started to go into a transaction
  //         // named after the event that fired it.

  //         // If we have not started a transaction through the code
  //         // invoked by the task, we should do so now.
  //         // because of ZoneTransactions, any trace started already will be
  //         // transferred.

  //         // nodeName is only defined for 15.0+
  //         var trans = transactionService.getCurrentTransaction()
  //         if (trans && nodeName && trans.name === 'ZoneTransaction' && args[0].nativeEvent.type in eventWhiteList) {
  //           var reactNode = nodeName(nativeEventTarget)
  //           transactionService.startTransaction(reactNode + ':' + args[0].nativeEvent.type, 'interaction')
  //         }
  //       }
  //     }
  //     return delegate.apply(self, args)
  //   }
  // })

  // var reactDom = require('react-dom')
  patchMethod(ReactMount, '_renderSubtreeIntoContainer', function (delegate) {
    return function (self, args) {
      if (serviceContainer) {
        var out
        return serviceContainer.services.zoneService.runInOpbeatZone(function () {
          out = delegate.apply(self, args)
          serviceContainer.services.transactionService.detectFinish()
          return out
        })
      } else {
        return delegate.apply(self, args)
      }
    }
  })
}
