var utils = require('../lib/utils')
var patchMethod = require('./patchUtils').patchMethod

var fetchTasks = 0
function patchFetch (transactionService) {
  function patchPromise (promise, trace) {
    if (utils.isUndefined(promise.then)) {
      return
    }

    patchMethod(promise, 'then', function (delegate) {
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
    })
  }

  if (window.fetch) {
    patchMethod(window, 'fetch', function (delegate) {
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
