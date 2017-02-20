var patchReact = require('./reactPatches')
var reactInternals = require('./reactInternals')
var ServiceFactory = require('opbeat-js-core').ServiceFactory
var ServiceContainer = require('opbeat-js-core').ServiceContainer
var utils = require('opbeat-js-core').utils
var reactUtils = require('./utils')
var getEventTarget = require('./getEventTarget')

var patchCommon = require('opbeat-js-core').patchCommon
var patchWebpack = require('./patchWebpack')
var patchFetch = require('./fetchPatch').patchFetch

require('zone.js')

var serviceFactory = new ServiceFactory()
var serviceContainer = new ServiceContainer(serviceFactory)
var enabled;
var configured = false;

var ComponentTree

serviceContainer.services.configService.set("VERSION", "%%VERSION%%")
serviceContainer.services.configService.set('opbeatAgentName', 'opbeat-react')
serviceContainer.services.configService.set('redux.actionsCount', 10)
serviceContainer.services.configService.set('redux.sendStateOnException', true)
serviceContainer.services.configService.set('errorLoggingEnabled', true)
serviceContainer.services.configService.set('performance.captureInteractions', true)
serviceContainer.services.configService.set('performance.capturePageLoad', true)

if(!reactUtils.inBrowser()) {
  serviceContainer.services.logger.warn('Opbeat: Only enabled in browser.')
  enabled = false
} else if(!serviceContainer.services.configService.isPlatformSupported()) {
  serviceContainer.services.logger.warn('Opbeat: Browser is not supported.')
  enabled = false;
} else {
  enabled = true;
}

function configure (config, serviceFactory) {
  if (!enabled) {
    return false
  }

  if (!utils.isUndefined(serviceFactory)) {
    serviceContainer = new ServiceContainer(serviceFactory)
  }

  patchCommon(serviceContainer)
  patchFetch(serviceContainer)
  patchWebpack(serviceContainer)

  // called when React injects its data
  reactInternals.ready(function (ReactInternals) {
    patchReact(ReactInternals, serviceContainer)
    ComponentTree = ReactInternals.ComponentTree
  })

  if (config) {
    serviceContainer.services.configService.setConfig(config)
  }

  serviceContainer.initialize()

  serviceContainer.services.transactionService.interactionStarted = function interactionStarted (task) {
    if (task.applyArgs && task.applyArgs[0] && task.applyArgs[0].target) {
      var realTarget = getEventTarget(task.applyArgs[0])
      var nodeName = reactUtils.nodeName(ComponentTree, realTarget)
      var tr = serviceContainer.services.transactionService.getCurrentTransaction()

      if (!tr || tr.name === 'ZoneTransaction') {
        serviceContainer.services.transactionService.startTransaction(nodeName + ':' + task.applyArgs[0].type, 'interaction')
      }
    }
  }
  
  _installErrorLogger(serviceContainer)

  configured = true

  return serviceContainer
}

function _installErrorLogger (serviceContainer) {
  if (serviceContainer.services.configService.get('errorLoggingEnabled')) {
    serviceContainer.services.exceptionHandler = serviceFactory.getExceptionHandler()
    serviceContainer.services.exceptionHandler.install()
  }
}

function getServiceContainer () {
  if (configured) {
    return serviceContainer
  }
}

function startTransaction () {
  if (configured) {
    var transactionService = serviceContainer.services.transactionService

    // start zone transaction if necessacy
    return transactionService.getCurrentTransaction()
  }
}

function setTransactionName (transactionName, transactionType) {
  if (configured) {
    serviceContainer.services.logger.trace('setTransactionName(\'' + transactionName + '\', \'' + transactionType + '\')')

    var transaction = serviceContainer.services.transactionService.getCurrentTransaction()

    if (!transaction) {
      transaction = startTransaction()
    }

    if (transaction/* && transaction.name !== 'ZoneTransaction'*/) {
      transaction.name = transactionName
      transaction.type = transactionType
    }
    
    return transaction
  }
}


module.exports = {
  configure: configure,
  setUserContext: function setUserContext (userContext) {
    serviceContainer.services.configService.set('context.user', userContext)
  },
  setExtraContext: function setExtraContext (data) {
    serviceContainer.services.configService.set('context.extra', data)
  },
  captureError: function captureError(error) {
    if (configured) {
      serviceContainer.services.exceptionHandler.processError(error)
    }
  },
  startTransaction: startTransaction,
  setTransactionName: setTransactionName,
  getServiceContainer: getServiceContainer,
}