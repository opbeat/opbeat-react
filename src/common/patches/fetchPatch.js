var utils = require('../../lib/utils')
var patchObject = require('../patchUtils').patchObject

var fetchTasks = 0

var fetchCounter = 0
function patchFetch (serviceContainer) {
  var transactionService = serviceContainer.services.transactionService

  var patch = function(trace) {
    return function (delegate) {
      return function (self, args) { // resolve, reject
        var task = {taskId: 'fetchTask' + fetchTasks++}
        transactionService.addTask(task.taskId)
        var resolve = args[0]
        args[0] = function () {
          if (!trace.ended) {
            trace.end()
          }
          var ret = resolve.apply(this, arguments)
          transactionService.removeTask(task.taskId)
          transactionService.detectFinish()
          return ret
        }

        var newPromise = delegate.apply(self, args)
        patchPromise(newPromise, trace)
        return newPromise
      }
    }
  }

  function patchPromise (promise, trace) {
    var myTrace = trace
    if (utils.isUndefined(promise.then)) {
      return
    }
    var fetchCounterLocal = fetchCounter
    fetchCounter++

    patchObject(promise, 'then', patch(trace))
  }

  if (window.fetch) {
    patchObject(window, 'fetch', function (delegate) {
      return function (self, args) { // url, urlOpts
        if (args.length < 1) {
          return delegate.apply(self, args)
        }
        var url = args[0]
        var trace = transactionService.startTrace('GET ' + url, 'ext.HttpRequest.fetch')

        var promise = delegate.apply(self, args)
        patchPromise(promise, trace)
        return promise
      }
    })
  }
}
module.exports = patchFetch
