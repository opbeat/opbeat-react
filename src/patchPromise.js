var utils = require('opbeat-js-core').utils
var patchObject = require('./utils').patchObject

var promiseTasks = 0

function patchPromise (transactionService, promise, trace, patchArguments, thenTasksCarried, catchTasksCarried) {
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
        var taskId = 'promiseTask' + promiseTasks++

        var resolve = args[0]
        var reject = args[1]

        if (resolve || reject) {
          transactionService.addTask(taskId)
        }

        if (resolve) {
          thenTasks.push(taskId)
          args[0] = function () {
            if (trace && !trace.ended) {
              trace.end()
            }

            if (patchArguments) {
              patchArguments(transactionService, arguments, trace)
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
            if (trace && !trace.ended) {
              trace.end()
            }

            if (patchArguments) {
              patchArguments(transactionService, arguments, trace)
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
        var taskId = 'fetchTask-catch' + promiseTasks++
        transactionService.addTask(taskId)

        catchTasks.push(taskId)
        var resolve = args[0]

        args[0] = function () {
          if (trace && !trace.ended) {
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

module.exports = patchPromise
