// Require react-dom early because it will inject the wrong default batching strategy
// We'll inject our own and override later
var reactDom = require('react-dom')

var ReactReconciler = require('react/lib/ReactReconciler')
var patchMethod = require('../common/patchUtils').patchMethod

var ReactDefaultBatchingStrategy = require('react/lib/ReactDefaultBatchingStrategy') 
var ReactInjection = require('react/lib/ReactInjection')


module.exports = function patchReact (serviceContainer) {
  var batchedUpdatePatch = function (delegate) {
    return function (self, args) {
      var ret
      try {
        serviceContainer.services.zoneService.set('componentsRendered', [])
        serviceContainer.services.zoneService.set('tagsRendered', [])
        var tr = serviceContainer.services.transactionService.startTrace('batchedUpdates', 'template.update')
        ret = delegate.apply(self, args)
        var components = serviceContainer.services.zoneService.get('componentsRendered')
        var tags = serviceContainer.services.zoneService.get('tagsRendered')
        var text = ''
        if (components.length === 0) {
          text = tags.length + ' tags'
        }else{
          text = components.length + ' components (' + tags.length + ' tags)'
        }
        tr.signature = 'Render ' + text
        tr.end()
      } finally {
        serviceContainer.services.zoneService.set('componentsRendered', [])
        serviceContainer.services.zoneService.set('tagsRendered', [])
      }
      return ret
    }
  }

  // var OpbeatAwareBatching = {
    
  // }
  // patchMethod(ReactUpdates, 'batchedUpdates', batchedUpdatePatch)
  patchMethod(ReactDefaultBatchingStrategy, 'batchedUpdates', batchedUpdatePatch)
  ReactInjection.Updates.injectBatchingStrategy(ReactDefaultBatchingStrategy)

  var componentRenderPatch = function (delegate) {
    return function (self, args) {
      if (args[0] && args[0].getName) {
        var components = serviceContainer.services.zoneService.get('componentsRendered') || []
        components.push(args[0].getName())
      }else if (args[0] && args[0]._tag) {
        var tags = serviceContainer.services.zoneService.get('tagsRendered') || []
        tags.push(args[0]._tag)
      }else{
        var tags = serviceContainer.services.zoneService.get('tagsRendered') || []
        tags.push("unknown")
      }
      return delegate.apply(self, args)
    }
  }

  patchMethod(ReactReconciler, 'mountComponent', componentRenderPatch)
  patchMethod(ReactReconciler, 'receiveComponent', componentRenderPatch)

  patchMethod(reactDom, 'render', function (delegate) {
    return function (self, args) {
      var out
      serviceContainer.services.zoneService.zone.run(function () {
        out = delegate.apply(self, args)
        serviceContainer.services.transactionService.detectFinish()
      })
      return out
    }
  })
}
