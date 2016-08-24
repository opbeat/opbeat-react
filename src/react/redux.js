function opbeatMiddleware (serviceContainer) {
  var transactionService = serviceContainer.services.transactionService
  return function () {
    return function (next) {
      return function (action) {
        var tr
        var ret

        var currTrans = transactionService.getCurrentTransaction()
        if (currTrans && currTrans.name !== 'ZoneTransaction') {
          if (action.type) {
            tr = transactionService.startTrace('dispatch ' + action.type, 'app.action')
          } else {
            tr = transactionService.startTrace('dispatch', 'app.action')
          }
        } else {
          if (action.type && !action.type.startsWith('@@')) {
            transactionService.startTransaction(action.type, 'spa.action')
          }
        }

        ret = next(action)

        if (tr) {
          tr.end()
        }

        return ret
      }
    }
  }
}

module.exports = {opbeatMiddleware: opbeatMiddleware}
