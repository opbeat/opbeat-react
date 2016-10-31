var utils = require('../../lib/utils')
var patchObject = require('../patchUtils').patchObject
var patchPromise = require('./patchPromise')
var noop = function () { }
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

function patchFetch () {
  if (window.fetch) {
    patchObject(window, 'fetch', function (delegate) {
      return function (self, args) { // url, urlOpts
        var serviceContainer
        if (!(serviceContainer = utils.opbeatGlobal()) || args.length < 1) {
          return delegate.apply(self, args)
        }
        var transactionService = serviceContainer.services.transactionService

        var url = args[0]
        var trace = transactionService.startTrace('GET ' + url, 'ext.HttpRequest.fetch')

        var promise = delegate.apply(self, args)

        promise.then(function () {
          trace.end()
          transactionService.detectFinish()
        })

        patchPromise(transactionService, promise, trace, patchResponse)
        return promise
      }
    })
  }
}
module.exports = {
  patchFetch: patchFetch,
  patchPromise: patchPromise
}
