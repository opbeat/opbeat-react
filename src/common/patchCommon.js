var patchXMLHttpRequest = require('./patches/xhrPatch')
var patchFetch = require('./patches/fetchPatch').patchFetch
var resourceLoading = require('./patches/resourceLoading')

function patchCommon () {
  patchXMLHttpRequest()
  patchFetch()
  resourceLoading()
}

module.exports = patchCommon
