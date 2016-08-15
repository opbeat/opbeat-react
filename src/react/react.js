var ServiceFactory = require('../common/ServiceFactory')
var ServiceContainer = require('../common/ServiceContainer')
var utils = require('../lib/utils')

var patchReact = require('./reactPatches')
var patchCommon = require('../common/patchCommon')


function init (config, serviceFactory) {
  if (utils.isUndefined(serviceFactory)) {
    serviceFactory = new ServiceFactory()
  }
  var serviceContainer = new ServiceContainer(serviceFactory)
  serviceContainer.services.configService.setConfig(config)

  patchCommon(serviceContainer)
  patchReact(serviceContainer)


  return serviceContainer
}


module.exports = init