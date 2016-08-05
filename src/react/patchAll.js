var commonPatches = require('../common/patchCommon')
var patchReact = require('./patches/react')
var patchReactRouter = require('./patches/router')
var patchRedux = require('./patches/redux')

module.exports = function patchAll (serviceContainer) {
  commonPatches(serviceContainer)
  patchReact(serviceContainer)
  patchReactRouter(serviceContainer)
  patchRedux(serviceContainer)
}
