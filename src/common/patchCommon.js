var patchXMLHttpRequest = require('./patches/xhrPatch')
var patchFetch = require('./patches/fetchPatch')

function patchCommon (serviceContainer) {
  patchXMLHttpRequest(serviceContainer)
  patchFetch(serviceContainer)
}

module.exports = patchCommon
