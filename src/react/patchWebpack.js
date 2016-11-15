var patchMethod = require('../common/patchUtils').patchMethod
var isPatched = require('../common/patchUtils').isPatched
var utils = require('../lib/utils')
var patchPromise = require('../common/patches/patchPromise')
var nextDDLTasksID = 0


function traceWebpackLoader (file) {
  var traceName =  (__webpack_require__.p || '/') + '' + file + '.bundle.js'
  var trace = serviceContainer.services.transactionService.startTrace(traceName, 'resource.script')
  return trace
}

module.exports = function() {
  // https://github.com/webpack/webpack/blob/54aa3cd0d6167943713491fd5e1110b777336be6/lib/dependencies/DepBlockHelpers.js#L22
  if (typeof __webpack_require__ !== 'undefined' && typeof __webpack_require__.e === 'function') {
    patchMethod(__webpack_require__, 'e', function (delegate) {
      return function (self, args) {
        serviceContainer = utils.opbeatGlobal()
        if (!serviceContainer) {
          // pass through
          return delegate.apply(self, args)
        } else {
          var transactionService = serviceContainer.services.transactionService
          var task = {
            taskId: "WebpackDLL" + (nextDDLTasksID++)
          }

          // webpack 1 takes a callback function
          if (args.length == 2 && typeof args[1] === 'function') {
            var trace = traceWebpackLoader(args[0])
            var cb = args[1]

            transactionService.addTask(task)

            patchMethod(args, 1, function (delegate) {
              return function (self, args) {
                serviceContainer.services.zoneService.runInOpbeatZone(function() {
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
            var trace = traceWebpackLoader(args[0])
            patchPromise(transactionService, promise, trace)
          }
          return promise
        }
      }
    })
  }
}