var opbeatSymbol = require('opbeat-js-core').patchUtils.opbeatSymbol

function isTopLevelWrapper (ReactMount, element) {
  // React 0.14.0+ exposes ReactMount.TopLevelWrapper
  var ReactTopLevelWrapper = ReactMount.TopLevelWrapper

  return element && element.type &&
  (
    element.type === ReactTopLevelWrapper ||
    element.type.isReactTopLevelWrapper
  )
}

function nodeName (ComponentTree, domNode) {
  if (ComponentTree) {
    var reactElem = ComponentTree.getClosestInstanceFromNode(domNode)

    if (!reactElem) {
      return DOMNodeName(domNode)
    }

    var elements = []
    var owner = reactElem._currentElement._owner

    reactElem = reactElem._hostParent

    while (reactElem && (owner === reactElem._currentElement._owner)) {
      elements.push(reactElem._tag)
      reactElem = reactElem._hostParent
    }

    if (owner !== null) {
      elements.push(owner.getName())
    } else if (reactElem && reactElem._currentElement && reactElem._currentElement._owner) {
      elements.push(reactElem._currentElement._owner.getName())
    }

    elements.unshift(DOMNodeName(domNode))

    // TODO: need a good way to get the name of the root component
    // (when both owner and reactElem._currentElement._owner is null)

    elements.reverse()
    return elements.join(' ')
  } else {
    return DOMNodeName(domNode)
  }
}

function DOMNodeName (domNode) {
  var tag = domNode.tagName ? domNode.tagName.toLowerCase() : ''
  if (domNode === document) {
    return 'document'
  }

  if (!domNode || !domNode.getAttribute) {
    return ''
  }
  var idName = domNode.getAttribute('id')
  idName = idName ? idName.trim() : ''

  var classes = (domNode.getAttribute('class') || '').trim().split(/\s+/).join('.')

  return tag + (idName ? '#' + idName : (classes ? '.' + classes : ''))
}

function RingBuffer (size) {
  var pointer = 0
  var buffer = []
  return {
    getAll: function getAll () {
      if (buffer.length < size) {
        return buffer
      }
      return buffer.slice(pointer, buffer.length).concat(buffer.slice(0, pointer))
    },
    push: function push (item) {
      buffer[pointer] = item
      pointer = (pointer + 1) % size
    }
  }
}

function opbeatGlobal (value) {
  if (!inBrowser()) {
    return
  }

  if (typeof value === 'undefined') {
    return window.__opbeat
  } else {
    window.__opbeat = value
  }
}

function inBrowser () {
  return typeof window !== 'undefined'
}

function createNamedFn (name, delegate) {
  try {
    return Function('f', 'return function ' + name + '(){return f(this, arguments)}')(delegate); // eslint-disable-line
  } catch (e) {
    // if we fail, we must be CSP, just return delegate.
    return function () {
      return delegate(this, arguments)
    }
  }
}

function patchObject (target, name, patchFn) {
  var delegateName = opbeatSymbol(name)
  var delegate = target[delegateName]
  if (!delegate) {
    delegate = target[delegateName] = target[name]
    target[name] = createNamedFn(name, patchFn(delegate, delegateName, name))
  }
  return delegate
}

module.exports = {
  nodeName: nodeName,
  isTopLevelWrapper: isTopLevelWrapper,
  RingBuffer: RingBuffer,
  DOMNodeName: DOMNodeName,
  opbeatGlobal: opbeatGlobal,
  inBrowser: inBrowser,
  patchObject: patchObject
}
