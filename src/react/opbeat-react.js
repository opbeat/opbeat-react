var ServiceFactory = require('../common/ServiceFactory')
var ServiceContainer = require('../common/ServiceContainer')
var utils = require('../lib/utils')

var patchAll = require('./patchAll')
var createStore = 1

function init (config, serviceFactory) {
  if (utils.isUndefined(serviceFactory)) {
    serviceFactory = new ServiceFactory()
  }
  var serviceContainer = new ServiceContainer(serviceFactory)
  serviceContainer.services.configService.setConfig(config)

  patchAll(serviceContainer)

  return serviceContainer
}


module.exports = init