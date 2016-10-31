var utils = require('../../lib/utils')
var patchObject = require('../patchUtils').patchObject

var fetchTasks = 0

var patchList = ['json', 'text', 'formData', 'blob', 'arrayBuffer', 'redirect', 'error']

function patchResponse (transactionService, response, trace) {
  patchList.forEach(function (funcName) {
    if (!utils.isUndefined(response[funcName])) {
      patchObject(response, funcName, function (delegate) {
        return function (self, args) {
          var promise = delegate.apply(self, args)
          patchPromise(transactionService, promise, trace, false)
          return promise
        }
      })
    }
  })
}

function patchPromise (transactionService, promise, trace, shouldPatchResponse, thenTasksCarried, catchTasksCarried) {
  var thenTasks = thenTasksCarried || []
  var catchTasks = catchTasksCarried || []

  function removeTaskList (taskList) {
    taskList.forEach(function (item) {
      transactionService.removeTask(item)
    })
  }

  if (!utils.isUndefined(promise.then)) {
    patchObject(promise, 'then', function (delegate) {
      return function (self, args) { // resolve, reject
        var taskId = 'fetchTask' + fetchTasks++

        var resolve = args[0]
        var reject = args[1]

        if (resolve || reject) {
          transactionService.addTask(taskId)
        }

        if (resolve) {
          thenTasks.push(taskId)
          args[0] = function () {
            if (!trace.ended) {
              trace.end()
            }

            if (shouldPatchResponse && arguments.length > 0 && arguments[0]) {
              patchResponse(transactionService, arguments[0], trace)
            }

            try {
              return resolve.apply(this, arguments)
            } finally {
              transactionService.removeTask(taskId)
              removeTaskList(catchTasks)
              transactionService.detectFinish()
            }
          }
        }

        if (reject) {
          catchTasks.push(taskId)
          args[1] = function () {
            if (!trace.ended) {
              trace.end()
            }

            if (shouldPatchResponse && arguments.length > 0 && arguments[0]) {
              patchResponse(arguments[0], trace)
            }

            try {
              return reject.apply(this, arguments)
            } finally {
              transactionService.removeTask(taskId)
              removeTaskList(thenTasks)
              transactionService.detectFinish()
            }
          }
        }

        var newPromise = delegate.apply(self, args)

        /*
          Promise wtf:

          p is a rejected promise
          p.then(a).catch(c)
          c gets called

          c never called:
          p.then(a, b).catch(c)
        */
        patchPromise(transactionService, newPromise, trace, false, thenTasks, catchTasks)

        return newPromise
      }
    })
  }

  if (!utils.isUndefined(promise.catch)) {
    patchObject(promise, 'catch', function (delegate) {
      return function (self, args) { // resolve, reject
        var taskId = 'fetchTask-catch' + fetchTasks++
        transactionService.addTask(taskId)

        catchTasks.push(taskId)
        var resolve = args[0]

        args[0] = function () {
          if (!trace.ended) {
            trace.end()
          }
          try {
            return resolve.apply(this, arguments)
          } finally {
            transactionService.removeTask(taskId)
            removeTaskList(thenTasks)
            transactionService.detectFinish()
          }
        }

        var newPromise = delegate.apply(self, args)
        patchPromise(transactionService, newPromise, trace, false)
        return newPromise
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

        patchPromise(transactionService, promise, trace, true)
        return promise
      }
    })
  }
}
module.exports = {
  patchFetch: patchFetch,
  patchPromise: patchPromise
}
