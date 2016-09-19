var React = require('react')

var components = require('./components')
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
  })
})
