var ReactDOMComponentTree = require('./reactInternals').ReactDOMComponentTree
var ReactInstanceHandles = require('./reactInternals').ReactInstanceHandles
var ReactMount = require('./reactInternals').ReactMount
var utils = require('../lib/utils')
var getReactElem, getParentReactElem
var traverseParents

// React 0.14.0+ exposes ReactMount.TopLevelWrapper
var ReactTopLevelWrapper = ReactMount.TopLevelWrapper


function isTopLevelWrapper(element) {
  return element && element.type &&
  (
    element.type === ReactTopLevelWrapper ||
    element.type.isReactTopLevelWrapper
  )
}


var nodeName
if (ReactDOMComponentTree) {
  nodeName = function nodeName (domNode) {
    var reactElem = ReactDOMComponentTree.getClosestInstanceFromNode(domElem)
    var elements = []
    var owner = reactElem._currentElement._owner

    reactElem = reactElem._hostParent
    
    while (reactElem && (owner === reactElem._currentElement._owner)) {
      elements.push(reactElem._tag)
      reactElem = reactElem._hostParent
    }

    var owner = reactElem._currentElement._owner

    if (owner !== null) {
      elements.push(owner.getName())
    } else if(reactElem && reactElem._currentElement && reactElem._currentElement._owner) {
      elements.push(reactElem._currentElement._owner.getName())
    }

    elements.unshift(utils.friendlyNodeName(domNode))

    // TODO: need a good way to get the name of the root component
    // (when both owner and reactElem._currentElement._owner is null)
    
    elements.reverse()
    return elements.join(' ')
  }
} else {
  nodeName = function nodeName (domNode) { return utils.friendlyNodeName(domNode) }
}

module.exports = {
  nodeName: nodeName,
  isTopLevelWrapper: isTopLevelWrapper
}
