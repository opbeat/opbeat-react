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
    return false  // disable
  } else {
    serviceContainer.initialize()

    serviceContainer.services.configService.setConfig(config)

    patchCommon(serviceContainer)
    patchReact(serviceContainer)
    return serviceContainer
  }
}

module.exports = init
