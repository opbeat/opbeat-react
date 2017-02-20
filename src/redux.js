var utils = require('opbeat-js-core').utils
var RingBuffer = require('./utils').RingBuffer
var getServiceContainer = require('./react').getServiceContainer

var passThrough = function (next) {
  return function (action) {
    return next(action)
  }
}

function createOpbeatMiddleware () {
  var transactionService
  var lastActions

  return function (store) {
    var serviceContainer = getServiceContainer()
    if (!serviceContainer) {
      return passThrough
    }

    if (!transactionService) {
      transactionService = serviceContainer.services.transactionService
      if (serviceContainer.services.configService.get('actionsCount')) {
        lastActions = new RingBuffer(serviceContainer.services.configService.get('redux.actionsCount'))
        serviceContainer.services.configService.set('redux._lastActions', lastActions)
      }

      if (serviceContainer.services.configService.get('sendStateOnException')) {
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
                tr = transactionService.startTrace('dispatch ' + action.type, 'action')
            } else {
                tr = transactionService.startTrace('dispatch', 'action')
              }
            } else {
              if (action.type) {
                currTrans = transactionService.startTransaction(action.type, 'action')
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
