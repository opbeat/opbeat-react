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

  if (!serviceContainer.services.configService.isPlatformSupported()) {
    serviceContainer.services.logger.warn('Opbeat: Browser is not supported.')

    // disable
    window.__opbeat = false
    return false
  } else {
    serviceContainer.initialize()

    serviceContainer.services.configService.setConfig(config)

    patchCommon(serviceContainer)
    patchReact(serviceContainer)

    window.__opbeat = serviceContainer

    return serviceContainer
  }
}

module.exports = init
