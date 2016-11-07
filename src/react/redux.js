var utils = require('../lib/utils')

var passThrough = function (next) {
  return function (action) {
    return next(action)
  }
}

function createOpbeatMiddleware (serviceContainer) {
  var transactionService
  var lastActions

  return function (store) {
    serviceContainer = utils.opbeatGlobal()
    if (!serviceContainer) {
      return passThrough
    }

    if (!transactionService) {
      transactionService = serviceContainer.services.transactionService
      if (serviceContainer.services.configService.get('redux.actionsCount')) {
        lastActions = new utils.RingBuffer(serviceContainer.services.configService.get('redux.actionsCount'))
        serviceContainer.services.configService.set('redux._lastActions', lastActions)
      }

      if (serviceContainer.services.configService.get('redux.sendStateOnException')) {
        serviceContainer.services.configService.set('redux._store', store)
      }
    }

    return function (next) {
      return function (action) {
        var tr, ret

        serviceContainer.services.zoneService.zone.run(function () {
          var currTrans
          currTrans = transactionService.getCurrentTransaction()
          if (action.type && action.type.indexOf('@@') !== 0) { // doesn't start with
            if (currTrans && currTrans.name !== 'ZoneTransaction') {
              if (action.type) {
                tr = transactionService.startTrace('dispatch ' + action.type, 'dispatch.redux')
              } else {
                tr = transactionService.startTrace('dispatch', 'dispatch.redux')
              }
            } else {
              if (action.type) {
                currTrans = transactionService.startTransaction(action.type, 'dispatch.redux')
              }
            }
          }

          if(utils.isObject(action) && action.type && lastActions) {
            lastActions.push(action.type)
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

module.exports = {
  createOpbeatMiddleware: createOpbeatMiddleware
}
