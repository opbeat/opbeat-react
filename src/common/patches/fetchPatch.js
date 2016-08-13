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
        console.log("then start:", trace.signature)
        args[0] = function () {
          if (!trace.ended) {
            console.log("!! Trace ended", trace.signature)
            trace.end()
          }
          var ret = resolve.apply(this, arguments)
          transactionService.removeTask(task.taskId)
          transactionService.detectFinish()
          console.log("then End:", trace.signature, task.taskId)
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

    console.log("Start (patchPromise):", myTrace.signature, fetchCounterLocal)

    // function recur(a, b) {
    //   var patch = function (b) {
    //     return function (c) { 
    //       console.log(a,b,c)
    //     }
    //   }
    //   return patch(b)
    // }
  
    patchObject(promise, 'then', patch(trace))
  }

  if (window.fetch) {
    patchObject(window, 'fetch', function (delegate) {
      return function (self, args) { // url, urlOpts
        if (args.length < 1) {
          return delegate.apply(self, args)
        }
        var url = args[0]
        var trace = transactionService.startTrace('GET ' + url, 'ext.Http')

        var promise = delegate.apply(self, args)
        patchPromise(promise, trace)
        return promise
      }
    })
  }
}
module.exports = patchFetch
