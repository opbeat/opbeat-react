// Order here matters
var ReactDefaultBatchingStrategy = require('react/lib/ReactDefaultBatchingStrategy')
var ReactReconciler = require('react/lib/ReactReconciler')
var ReactInjection = require('react/lib/ReactInjection')
var EventPluginUtils = require('react/lib/EventPluginUtils')

var getEventTarget = require('react/lib/getEventTarget')

var patchMethod = require('../common/patchUtils').patchMethod
var nodeName = require('./utils').nodeName

var Trace = require('../transaction/trace')

function calcAvg (timings) {
  var sum = 0
  for (var j = 0; j < timings.length; j++) {
    sum += timings[j]
  }
  return sum / timings.length
}


function genTraces (componentStats, node, transactionService, transaction) {
  var child
  for (var i = 0; i < node.children.length; i++) {
    child = node.children[i]
    var trace = new Trace(transaction, child.name, 'template.component', {})
    child.trace = trace // needed to estimate children
    trace.setParent(transaction._rootTrace)
    if (child.start) {
      trace._start = child.start
      trace._end = child.end
    } else { // estimate
      if (i > 0) {
        // get start from prev child
        trace._start = node.children[i - 1].trace._end
      } else {
        // or parent
        trace._start = node.trace._start
      }

      if (!componentStats[child.name].avg) {
        componentStats[child.name].avg = calcAvg(componentStats[child.name].timings)
      }
      trace._end = trace._start + componentStats[child.name].avg
    }

    trace.end()

    genTraces(componentStats, child, transactionService, transaction)
  }
}

function RenderState () {
  return {
    'componentStats': {},
    'currRoot': {'children': []}
  }
}


module.exports = function patchReact (serviceContainer) {
  var transactionService = serviceContainer.services.transactionService

  var batchedUpdatePatch = function (delegate) {
    return function (self, args) {
      var ret
      var trace

      serviceContainer.services.zoneService.set('renderState', new RenderState())
      var batchedUpdatesStart = window.performance.now()

      ret = delegate.apply(self, args)

      var renderState = serviceContainer.services.zoneService.get('renderState')
      var componentTypes = Object.keys(renderState.componentStats)
      if (componentTypes.length > 0) {
        trace = transactionService.startTrace('batchedUpdates', 'template.update')
        trace._start = batchedUpdatesStart

        var text = componentTypes.length + ' different components'
        trace.signature = 'Render ' + text
        trace.end()

        renderState.currRoot.trace = trace
        genTraces(renderState.componentStats, renderState.currRoot, transactionService, transactionService.getCurrentTransaction())
      }
      return ret
    }
  }

  patchMethod(ReactDefaultBatchingStrategy, 'batchedUpdates', batchedUpdatePatch)
  ReactInjection.Updates.injectBatchingStrategy(ReactDefaultBatchingStrategy)

  var componentRenderPatch = function (delegate) {
    return function (self, args) {
      if (args[0] && args[0].getName) {
        var name = args[0].getName()
        if (name === 'TopLevelWrapper' || name === null) {
          // TopLevelWrapper or null components don't make sense to include here
          return delegate.apply(self, args)
        }

        var out
        var renderState = serviceContainer.services.zoneService.get('renderState')

        if (!renderState.componentStats[name]) {
          renderState.componentStats[name] = {'count': 0, 'timings': []}
        }
        var componentStat = renderState.componentStats[name]
        componentStat['count']++

        var shouldTrace = componentStat['count'] < 10
        var node = {'children': [], 'name': name}
        var parent = renderState.currRoot

        renderState.currRoot.children.push(node)
        renderState.currRoot = node

        if (shouldTrace) {
          var start = performance.now()
          out = delegate.apply(self, args)
          var end = performance.now()
          componentStat.timings.push(end - start)
          node.start = start
          node.end = end
        } else {
          out = delegate.apply(self, args)
        }

        renderState.currRoot = parent
        return out
      } else {
        return delegate.apply(self, args)
      }
    }
  }

  patchMethod(ReactReconciler, 'mountComponent', componentRenderPatch)
  patchMethod(ReactReconciler, 'receiveComponent', componentRenderPatch)
  patchMethod(ReactReconciler, 'performUpdateIfNecessary', componentRenderPatch)

  patchMethod(EventPluginUtils, 'executeDispatchesInOrder', function (delegate) {
    // for quick lookup, make this into an object
    var eventWhiteList = {}
    var performance = serviceContainer.services.configService.get('performance')
    var configWhiteList = performance.eventWhiteList || []
    configWhiteList.forEach(function (ev) {
      eventWhiteList[ev] = 1
    })

    return function (self, args) {
      if (args[0] && args[0]._dispatchListeners && args[0].nativeEvent) {
        var nativeEventTarget = getEventTarget(args[0].nativeEvent)
        if (nativeEventTarget) {
          // We want traces that have already started to go into a transaction
          // named after the event that fired it.

          // If we have not started a transaction through the code
          // invoked by the task, we should do so now.
          // because of ZoneTransactions, any trace started already will be
          // transferred.
          var trans = transactionService.getCurrentTransaction()
          if (trans && trans.name === 'ZoneTransaction' && args[0].nativeEvent.type in eventWhiteList) {
            var reactNode = nodeName(nativeEventTarget)
            transactionService.startTransaction(reactNode + ':' + args[0].nativeEvent.type, 'spa.action')
          }
        }
      }
      return delegate.apply(self, args)
    }
  })

  var reactDom = require('react-dom')
  patchMethod(reactDom, 'render', function (delegate) {
    return function (self, args) {
      var out
      return serviceContainer.services.zoneService.zone.run(function () {
        out = delegate.apply(self, args)
        serviceContainer.services.transactionService.detectFinish()
        return out
      })
    }
  })
}
