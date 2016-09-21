var React = require('react')

var components = require('./components.jsx')
var nodeName = require('../../src/react/utils').nodeName

var ListOfLists = components.ListOfLists

var mount = require('enzyme').mount

describe('react: nodeName', function () {
  it('gets the correct name for nested components', function () {
    var wrapper = mount(React.createElement(ListOfLists))
    var li = wrapper.find('li').node
    expect(nodeName(li)).toBe('List ul li.item1')

    var p = wrapper.find('p').node
    expect(nodeName(p)).toBe('ListOfLists div p#paragraph')

    // nested madness
    var span = wrapper.find('span.span1').node
    expect(span).toBeTruthy()
    expect(nodeName(span)).toBe('Link span.span1')

    var span2 = wrapper.find('span.span2').node
    expect(span2).toBeTruthy()
    expect(nodeName(span2)).toBe('Value div span.span2')
  })
})
