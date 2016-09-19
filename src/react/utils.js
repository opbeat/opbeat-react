var ReactDOMComponentTree = require('react/lib/ReactDOMComponentTree')

var utils = require('../lib/utils')


function nodeName (domNode) {
  var reactElem = ReactDOMComponentTree.getClosestInstanceFromNode(domNode)
  var elements = []
  var initialHostParent = reactElem._currentElement._owner
  reactElem = reactElem._hostParent

  while (reactElem && initialHostParent === reactElem._currentElement._owner) {
    elements.push(reactElem._tag)
    reactElem = reactElem._hostParent
  }

  elements.unshift(utils.friendlyNodeName(domNode))

  var reactTopLevelName = initialHostParent.getName()
  elements.push(reactTopLevelName)

  elements.reverse()
  return elements.join(' ')
}


module.exports = {
  nodeName: nodeName
}
