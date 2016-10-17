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
  if(typeof window === 'undefined') {
    return false
  }

  if (!serviceContainer.services.configService.isPlatformSupported()) {
    serviceContainer.services.logger.warn('Opbeat: Browser is not supported.')

    // disable
    window.__opbeat = false
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

    window.__opbeat = serviceContainer

    return serviceContainer
  }
}

module.exports = init
