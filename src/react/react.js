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
  serviceContainer.initialize()
  serviceContainer.services.configService.setConfig(config)

  patchCommon(serviceContainer)
  patchReact(serviceContainer)

  return serviceContainer
}

module.exports = init
