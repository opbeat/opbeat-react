var commonPatches = require('../common/patchCommon')
var patchReact = require('./reactPatches')

module.exports = function patchAll (serviceContainer) {
  commonPatches(serviceContainer)
  patchReact(serviceContainer)
}
