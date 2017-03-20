var patchUtils = require('opbeat-js-core').patchUtils
var patchPromise = require('./patchPromise')
var patchMethod = patchUtils.patchMethod

function isPatched (target, name) {
  var delegateName = patchUtils.opbeatSymbol(name)
  return !!target[delegateName]
}

var nextDDLTasksID = 0

module.exports = function (serviceContainer) {
  // https://github.com/webpack/webpack/blob/54aa3cd0d6167943713491fd5e1110b777336be6/lib/dependencies/DepBlockHelpers.js#L22
  if (typeof __webpack_require__ !== 'undefined' && typeof __webpack_require__.e === 'function') {  // eslint-disable-line
    var traceWebpackLoader = function traceWebpackLoader (file) {
      var traceName = (__webpack_require__.p || '/') + '' + file + '.bundle.js'  // eslint-disable-line
      var trace = serviceContainer.services.transactionService.startTrace(traceName, 'resource.script')
      return trace
    }

    patchMethod(__webpack_require__, 'e', function (delegate) {  // eslint-disable-line
      return function (self, args) {
        if (!serviceContainer) {
          // pass through
          return delegate.apply(self, args)
        } else {
          var transactionService = serviceContainer.services.transactionService
          var trace
          var task = {
            taskId: 'WebpackDLL' + (nextDDLTasksID++)
          }

          // webpack 1 takes a callback function
          if (args.length === 2 && typeof args[1] === 'function') {
            trace = traceWebpackLoader(args[0])
            transactionService.addTask(task)

            patchMethod(args, 1, function (delegate) {
              return function (self, args) {
                serviceContainer.services.zoneService.runInOpbeatZone(function () {
                  trace.end()
                  delegate.apply(self, args)
                  transactionService.removeTask(task)
                  transactionService.detectFinish()
                })
              }
            })
          }

          var promise = delegate.apply(self, args)

          // webpack 2 returns a promise
          if (promise && !isPatched(promise, 'then')) {
            trace = traceWebpackLoader(args[0])
            patchPromise(transactionService, promise, trace)
          }
          return promise
        }
      }
    })
  }
}
