function opbeatMiddleware (serviceContainer) {
  var transactionService = serviceContainer.services.transactionService
  return function () {
    return function (next) {
      return function (action) {
        var tr, ret

        serviceContainer.services.zoneService.zone.run(function () {
          var currTrans
          currTrans = transactionService.getCurrentTransaction()
          if (!action.type.startsWith('@@')) {
            if (currTrans && currTrans.name !== 'ZoneTransaction') {
              if (action.type) {
                tr = transactionService.startTrace('dispatch ' + action.type, 'app.action')
              } else {
                tr = transactionService.startTrace('dispatch', 'app.action')
              }
            } else {
              if (action.type) {
                currTrans = transactionService.startTransaction(action.type, 'spa.action')
              }
            }
          }

          ret = next(action)


          if (currTrans) {
            currTrans.detectFinish()
          }

        })

        if (tr) {
          tr.end()
        }

        return ret
      }
    }
  }
}

module.exports = {opbeatMiddleware: opbeatMiddleware}
