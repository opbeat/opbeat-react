var ReactUpdates = require('react/lib/ReactUpdates')
// var ReactDefaultBatchingStrategy = require('react/lib/ReactDefaultBatchingStrategy')
var ReactReconciler = require('react/lib/ReactReconciler')

var patchMethod = require('../patching/patchUtils').patchMethod

var reactDom = require('react-dom')
var ServiceFactory = require('../common/serviceFactory')
var ServiceContainer = require('../common/serviceContainer')
var patchReactRouter = require('./router')

var batchedUpdatePatch = function (delegate) {
  return function (self, args) {
    var serviceContainer = window.__opbeat_services
    var ret
    try {
      serviceContainer.services.zoneService.set('componentsRendered', [])
      var tr = serviceContainer.services.transactionService.startTrace('batchedUpdates', 'template.update')
      ret = delegate.apply(self, args)
      tr.signature = 'Render ' + serviceContainer.services.zoneService.get('componentsRendered').length + ' components'
      tr.end()
    } finally {
      serviceContainer.services.zoneService.set('componentsRendered', [])
    }
    return ret
  }
}
patchMethod(ReactUpdates, 'batchedUpdates', batchedUpdatePatch)
patchMethod(ReactUpdates, 'ReactDefaultBatchingStrategy', batchedUpdatePatch)

var componentRenderPatch = function (delegate) {
  return function (self, args) {
    var serviceContainer = window.__opbeat_services

    if (args[0] && args[0].getName) {
      var components = serviceContainer.services.zoneService.get('componentsRendered') || []
      components.push(args[0].getName())
    }
    return delegate.apply(self, args)
  }
}

patchMethod(ReactReconciler, 'mountComponent', componentRenderPatch)
patchMethod(ReactReconciler, 'receiveComponent', componentRenderPatch)

function init () {
  var serviceFactory = new ServiceFactory()
  var serviceContainer = new ServiceContainer(serviceFactory)
  window.__opbeat_services = serviceContainer
  serviceContainer.services.configService.setConfig(
    {
      'debug': true,
      'logLevel': 'trace',
      'orgId': '470d9f31bc7b4f4395143091fe752e8c',
      'appId': '9aac8591bb'
    }
  )

  var transactionService = serviceContainer.services.transactionService
  patchReactRouter(transactionService)

  patchMethod(reactDom, 'render', function (delegate) {
    return function (self, args) {
      var out
      serviceContainer.services.zoneService.zone.run(function () {
        out = delegate.apply(self, args)
      })
      return out
    }
  })
  serviceContainer.services.patchingService.patchAll()
}

init()
