var patchUtils = require('../../common/patchUtils')
var opbeatTaskSymbol = patchUtils.opbeatSymbol('taskData')
var utils = require('../../lib/utils')

var observer

function init () {
  if (window.MutationObserver && document.head) {
    if (!observer) {
      observer = new window.MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
          if (mutations[i].addedNodes.length > 0) {
            // when `script` tags are added
            var nodeList = mutations[i].addedNodes
            for (var j=0; j < nodeList.length; j++) {
              var node = nodeList[j] 
              if (node.nodeName.toLowerCase() == 'script' && node.src && node[opbeatTaskSymbol]) {
                node[opbeatTaskSymbol].downloadStarted()
              }
            }
          } else {
            // when `script` tags are added and subsequently have the src attribute set.
            var node = mutations[i].target
            if (node.nodeName.toLowerCase() == 'script' && node.src) {
              if (node[opbeatTaskSymbol]) {
                node[opbeatTaskSymbol].downloadStarted()
              } else {
                node.addEventListener('onload', function () {}) // trigger our instrumentation
              }
            }
          }
        }
      })
    }
    observer.observe(document.head, {subtree: true, childList: true, attributes: true, attributeOldValue: true, attributeFilter: ['src']})
  }
}



module.exports = init
