// Order here matters
var ReactDefaultBatchingStrategy = require('react/lib/ReactDefaultBatchingStrategy')
var ReactReconciler = require('react/lib/ReactReconciler')
var ReactInjection = require('react/lib/ReactInjection')
var EventPluginUtils = require('react/lib/EventPluginUtils')
var ReactMount = require('react/lib/ReactMount')
var getEventTarget = require('react/lib/getEventTarget')

var patchMethod = require('../common/patchUtils').patchMethod
var nodeName = require('./utils').nodeName
var utils = require('../lib/utils')

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
    trace.setParent(node.trace)
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
    'componentCount': 0,
    'currRoot': {'children': []}
  }
}


module.exports = function patchReact () {
  var serviceContainer

  var batchedUpdatePatch = function (delegate) {
    return function (self, args) {
      var ret
      var trace
      serviceContainer = utils.opbeatGlobal()
      if (!serviceContainer || serviceContainer.services.zoneService.get('renderState')) {
        // pass through if not loaded or batchedUpdate is already ongoing
        return delegate.apply(self, args)
      }

      var transactionService = serviceContainer.services.transactionService

      serviceContainer.services.zoneService.set('renderState', new RenderState())
      var batchedUpdatesStart = window.performance.now()

      ret = delegate.apply(self, args)

      var renderState = serviceContainer.services.zoneService.get('renderState')
      serviceContainer.services.zoneService.set('renderState', null)

      var componentTypes = Object.keys(renderState.componentStats)
      if (componentTypes.length > 0) {
        trace = transactionService.startTrace('batchedUpdates', 'template.update')
        trace._start = batchedUpdatesStart

        var text
        if (renderState.currRoot.children.length > 1) {
          var allRootComponents = renderState.currRoot.children.map(function(n) { return n.name })
          var uniqueRootComponents = {}
          for (var i = 0; i < allRootComponents.length; i++) {
            uniqueRootComponents[allRootComponents[i]] = true
          }
          text = Object.keys(uniqueRootComponents).length + " components"
        } else {
          text = renderState.currRoot.children[0].name
        }
        
        trace.signature = text + ' (' + renderState.componentCount + ')' 
        trace.end()

        renderState.currRoot.trace = trace

        var genTracesTime = performance.now()
        var transaction = transactionService.getCurrentTransaction()

        genTraces(renderState.componentStats, renderState.currRoot, transactionService, transaction)
        var elapsed = performance.now() - genTracesTime

        if(!transaction.contextInfo.debug.genTracesElapsed) {
          transaction.contextInfo.debug.genTracesElapsed = []
        }
        transaction.contextInfo.debug.genTracesElapsed.push(elapsed)
      }
      return ret
    }
  }

  patchMethod(ReactDefaultBatchingStrategy, 'batchedUpdates', batchedUpdatePatch)
  ReactInjection.Updates.injectBatchingStrategy(ReactDefaultBatchingStrategy)

  // React 0.14.0+ exposes ReactMount.TopLevelWrapper
  var ReactTopLevelWrapper = ReactMount.TopLevelWrapper

  var componentRenderPatch = function (delegate) {
    var serviceContainer
    return function (self, args) {
      if (!serviceContainer) {
        serviceContainer = utils.opbeatGlobal()
      }

      if (serviceContainer && args[0] && args[0].getName) {
        var component = args[0]
        var name = component.getName()
        // debugger;
        if (
            name === null || 
            (
              component._currentElement && component._currentElement.type &&
                (
                  component._currentElement.type === ReactTopLevelWrapper ||
                  component._currentElement.type.isReactTopLevelWrapper
                )
            )
        ) {
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

        renderState.componentCount++

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
    var serviceContainer
    var performanceEnabled
    var configWhiteList
    var transactionService

    return function (self, args) {
      if (!serviceContainer) {
        serviceContainer = utils.opbeatGlobal()
        if (serviceContainer) {
          // first time
          var configWhiteList = serviceContainer.services.configService.get('performance.eventWhiteList')  || []
          configWhiteList.forEach(function (ev) {
            eventWhiteList[ev] = 1
          })
          transactionService = serviceContainer.services.transactionService
        }
      }

      if (serviceContainer && args[0] && args[0]._dispatchListeners && args[0].nativeEvent) {
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
            transactionService.startTransaction(reactNode + ':' + args[0].nativeEvent.type, 'event.' + args[0].nativeEvent.type)
          }
        }
      }
      return delegate.apply(self, args)
    }
  })

  var reactDom = require('react-dom')
  patchMethod(reactDom, 'render', function (delegate) {
    var serviceContainer

    return function (self, args) {
      serviceContainer = serviceContainer || utils.opbeatGlobal()
      if (serviceContainer) {
        var out
        return serviceContainer.services.zoneService.zone.run(function () {
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
