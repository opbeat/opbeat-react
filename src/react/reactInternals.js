var EventPluginUtils
var _opbeatId = 0
var _hooks = {}
var out = {}
var injected;
var readyCBs = []

if (typeof window !== 'undefined') {
  if (typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ === 'undefined') {
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {}
  }
  var old = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject = function (reactInternals) {
    for(var i = 0; i<readyCBs.length; i++) {
      readyCBs[i](reactInternals)
    }
    injected = reactInternals
    
    if (old) {
      old.apply(this, arguments)
    }
  }
}

module.exports = {
  ready: function (cb) {
    if (injected) {
      cb(injected)
    }else{
      readyCBs.push(cb)
    }
  }
}
