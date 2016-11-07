var ServiceFactory = require('../common/serviceFactory')
var ServiceContainer = require('../common/serviceContainer')
var utils = require('../lib/utils')

var patchReact = require('./reactPatches')
var patchCommon = require('../common/patchCommon')
var patchWebpack = require('./patchWebpack')

var serviceContainer = new ServiceContainer(new ServiceFactory())

if(!utils.inBrowser()) {
  serviceContainer.services.logger.warn('Opbeat: Only enabled in browser.')
  // disable
  utils.opbeatGlobal(false)

} else if(!serviceContainer.services.configService.isPlatformSupported()) {
  serviceContainer.services.logger.warn('Opbeat: Browser is not supported.')
  // disable
  utils.opbeatGlobal(false)
} else {
  patchCommon()
  patchReact()
  patchWebpack()
}

function configure (config, serviceFactory) {
  if (!utils.isUndefined(serviceFactory)) {
    serviceContainer = new ServiceContainer(serviceFactory)
  }

  // no server side support at the moment
  if(!utils.inBrowser() || !serviceContainer.services.configService.isPlatformSupported()) {
    return false
  } else {  
    serviceContainer.services.configService.set('opbeatAgentName', 'opbeat-react')
    serviceContainer.services.configService.set('redux.actionsCount', 10)
    serviceContainer.services.configService.set('redux.sendStateOnException', true)
    serviceContainer.services.configService.setConfig(config)
    serviceContainer.initialize()

    if (serviceContainer.services.configService.get('errorLoggingEnabled')) {
      serviceContainer.services.exceptionHandler.install()
    }
    // instrumentation should be pass-through until we set opbeatGlobal
    utils.opbeatGlobal(serviceContainer)

    return serviceContainer
  }
}

module.exports = {
  __esModule: true,
  default: configure,
  setUserContext: function setUserContext (userContext) {
    if (utils.opbeatGlobal()) {
      utils.opbeatGlobal().services.configService.set('context.user', userContext)
    }
  },
  setExtraContext: function setExtraContext (data) {
    if (utils.opbeatGlobal()) {
      utils.opbeatGlobal().services.configService.set('context.extra', data)
    }
  },
  captureError: function captureError(error) {
    if (utils.opbeatGlobal()) {
      utils.opbeatGlobal().services.exceptionHandler.processError(error)
    }
  }
}
