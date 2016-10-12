var ReactDOMComponentTree = require('react/lib/ReactDOMComponentTree')

var utils = require('../lib/utils')

function nodeName (domNode) {
  var reactElem = ReactDOMComponentTree.getClosestInstanceFromNode(domNode)
  var elements = []
  var owner = reactElem._currentElement._owner
  reactElem = reactElem._hostParent

  while (reactElem && (owner === reactElem._currentElement._owner)) {
    elements.push(reactElem._tag)
    reactElem = reactElem._hostParent
  }

  elements.unshift(utils.friendlyNodeName(domNode))

  if (owner !== null) {
    elements.push(owner.getName())
  } else if(reactElem && reactElem._currentElement && reactElem._currentElement._owner) {
    elements.push(reactElem._currentElement._owner.getName())
  }

  // TODO: need a good way to get the name of the root component
  // (when both owner and reactElem._currentElement._owner is null)
  
  elements.reverse()
  return elements.join(' ')
}

module.exports = {
  nodeName: nodeName
}
