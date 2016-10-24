var ServiceFactory = require('../common/serviceFactory')
var ServiceContainer = require('../common/serviceContainer')
var utils = require('../lib/utils')

var patchReact = require('./reactPatches')
var patchCommon = require('../common/patchCommon')

function init (config, serviceFactory) {
  if (utils.isUndefined(serviceFactory)) {
    serviceFactory = new ServiceFactory()
  }

  var serviceContainer = new ServiceContainer(serviceFactory)

  // no server side support at the moment
  if(!utils.inBrowser()) {
    return false
  }

  if (!serviceContainer.services.configService.isPlatformSupported()) {
    serviceContainer.services.logger.warn('Opbeat: Browser is not supported.')

    // disable
    utils.opbeatGlobal(false)
    return false
  } else {
    serviceContainer.services.configService.set('opbeatAgentName', 'opbeat-react')
    serviceContainer.initialize()

    serviceContainer.services.configService.setConfig(config)

    if (serviceContainer.services.configService.get('errorLoggingEnabled')) {
      serviceContainer.services.exceptionHandler.install()
    }

    patchCommon(serviceContainer)
    patchReact(serviceContainer)

    utils.opbeatGlobal(serviceContainer)

    return serviceContainer
  }
}

module.exports = {
  __esModule: true,
  default: init,
  setUserContext: function setUserContext (userContext) {
    if (utils.inBrowser() && utils.opbeatGlobal()) {
      utils.opbeatGlobal().services.configService.set('context.user', userContext)
    }
  },
  setExtraContext: function setExtraContext (data) {
    if (utils.inBrowser() && utils.opbeatGlobal()) {
      utils.opbeatGlobal().services.configService.set('context.extra', data)
    }
  }
}
