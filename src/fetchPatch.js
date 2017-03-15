var utils = require('opbeat-js-core').utils
var patchObject = require('./utils').patchObject
var patchPromise = require('./patchPromise')
var patchList = ['json', 'text', 'formData', 'blob', 'arrayBuffer', 'redirect', 'error']

function patchResponse (transactionService, args, trace) {
  if (args.length > 0 && args[0]) {
    patchList.forEach(function (funcName) {
      if (!utils.isUndefined(args[0][funcName])) {
        patchObject(args[0], funcName, function (delegate) {
          return function (self, args) {
            var promise = delegate.apply(self, args)
            patchPromise(transactionService, promise, trace)
            return promise
          }
        })
      }
    })
  }
}
var fetchTaskId = 0;
function patchFetch (serviceContainer) {
  if (window.fetch) {
    patchObject(window, 'fetch', function (delegate) {
      return function (self, args) { // url, urlOpts
        if (!serviceContainer) {
          return delegate.apply(self, args)
        }

        var transactionService = serviceContainer.services.transactionService
        var taskId =  'fetchTask' + fetchTaskId++
        var url = args[0]
        var trace = transactionService.startTrace('GET ' + url, 'ext.HttpRequest.fetch')
        transactionService.addTask(taskId)
        var promise = delegate.apply(self, args)

        var fin = function () {
          if (trace) {
            trace.end()
            transactionService.removeTask(taskId)
          }

          transactionService.detectFinish()
        }

        promise.then(fin)

        patchPromise(transactionService, promise, trace, patchResponse, [taskId], [taskId])
        return promise
      }
    })
  }
}
module.exports = {
  patchFetch: patchFetch,
  patchPromise: patchPromise
}
