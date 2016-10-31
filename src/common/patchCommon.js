var patchXMLHttpRequest = require('./patches/xhrPatch')
var patchFetch = require('./patches/fetchPatch').patchFetch

function patchCommon () {
  patchXMLHttpRequest()
  patchFetch()
}

module.exports = patchCommon
