// var ReactDOMComponentTree = require('./reactInternals').ReactDOMComponentTree
// var ReactMount = require('./reactInternals').ReactMount
var utils = require('../lib/utils')
var getReactElem, getParentReactElem
var traverseParents

function isTopLevelWrapper(ReactMount, element) {
  // React 0.14.0+ exposes ReactMount.TopLevelWrapper
  var ReactTopLevelWrapper = ReactMount.TopLevelWrapper

  return element && element.type &&
  (
    element.type === ReactTopLevelWrapper ||
    element.type.isReactTopLevelWrapper
  )
}

var nodeName = function nodeName (ComponentTree, domNode) {
  if (ComponentTree) {
    var reactElem = ComponentTree.getClosestInstanceFromNode(domNode)
    var elements = []
    var owner = reactElem._currentElement._owner

    reactElem = reactElem._hostParent
    
    while (reactElem && (owner === reactElem._currentElement._owner)) {
      elements.push(reactElem._tag)
      reactElem = reactElem._hostParent
    }

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
  } else {
    return utils.friendlyNodeName(domNode)
  }
}

module.exports = {
  nodeName: nodeName,
  isTopLevelWrapper: isTopLevelWrapper
}
