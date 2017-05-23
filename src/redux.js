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
  var configService
  var lastActions

  return function (store) {
    var serviceContainer = getServiceContainer()
    if (!serviceContainer) {
      return passThrough
    }

    if (!transactionService) {
      transactionService = serviceContainer.services.transactionService
      configService = serviceContainer.services.configService
      if (configService.get('actionsCount')) {
        lastActions = new RingBuffer(configService.get('actionsCount'))
        configService.set('redux._lastActions', lastActions)
      }

      if (configService.get('sendStateOnException')) {
        configService.set('redux._store', store)
      }
    }

    return function (next) {
      return function (action) {
        var tr, ret

        serviceContainer.services.zoneService.zone.run(function () {
          var currTrans
          currTrans = transactionService.getCurrentTransaction()
          var actionType
          if (typeof action.type !== 'undefined' && action.type !== null) { // Supporting typeof action.type === 'symbol' and other types
            actionType = String(action.type)
            //  Redux internal action types start with '@@' and they're strings as opposed to Symbols
            if (actionType.indexOf('@@') !== 0) { // doesn't start with '@@'
              if (currTrans && currTrans.name !== 'ZoneTransaction') {
                tr = transactionService.startTrace('dispatch ' + actionType, 'action')
              } else {
                currTrans = transactionService.startTransaction(actionType, 'action')
              }
            }
          }
          // Ignoring undefined or null action.type

          if (utils.isObject(action) && actionType && lastActions && !transactionService.shouldIgnoreTransaction(actionType)) {
            lastActions.push(actionType)
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
