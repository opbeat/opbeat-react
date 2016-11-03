var patchMethod = require('../common/patchUtils').patchMethod
var isPatched = require('../common/patchUtils').isPatched
var utils = require('../lib/utils')
var patchPromise = require('../common/patches/patchPromise')
var nextDDLTasksID = 0

module.exports = function() {
  // https://github.com/webpack/webpack/blob/54aa3cd0d6167943713491fd5e1110b777336be6/lib/dependencies/DepBlockHelpers.js#L22
  if (typeof __webpack_require__ !== 'undefined' && __webpack_require__.e) {
    patchMethod(__webpack_require__, 'e', function (delegate) {
      return function (self, args) {
        serviceContainer = utils.opbeatGlobal()
        if (!serviceContainer) {
          // pass through
          return delegate.apply(self, args)
        } else {

          var task = {
            taskId: "WebpackDLL" + (nextDDLTasksID++)
          }
          
          var promise = delegate.apply(self, args)

          if (!isPatched(promise, 'then')) {
            var traceName =  (__webpack_require__.p || '/') + '' + args[0] + '.bundle.js'
            var trace = serviceContainer.services.transactionService.startTrace(traceName, 'resource.script')
            patchPromise(serviceContainer.services.transactionService, promise, trace)
          }
          return promise
        }
      }
    })
  }
}