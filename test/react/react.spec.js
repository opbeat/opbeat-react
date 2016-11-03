var React = require('react')
var ServiceContainer = require('../../src/common/serviceContainer')
var ServiceFactory = require('../../src/common/ServiceFactory')
var utils = require('../../src/lib/utils')
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

describe('react: generate traces', function () {

  var transactionService
  var serviceContainer
  // var tree
  // var treeWrapper

  beforeEach(function () {
    serviceContainer = new ServiceContainer(new ServiceFactory())
    serviceContainer.initialize()
    utils.opbeatGlobal(serviceContainer)
    // Get rid of warning 'Location '/context.html''
    // browserHistory.push('/')

    transactionService = serviceContainer.services.transactionService
  })

  it('gets the correct name for nested components', function () {
    var trans = transactionService.startTransaction('react-component-test', 'test')

    serviceContainer.services.zoneService.runInOpbeatZone(function() {
      var wrapper = mount(React.createElement(ListOfLists))

      var expected = [
        {signature: 'Constructor (5)', type: 'template.update'}, // Enzyme adds a wrapper :/
        {signature: 'Constructor', type: 'template.component'},
        {signature: 'ListOfLists', type: 'template.component'},
        {signature: 'List', type: 'template.component'},
        {signature: 'Value', type: 'template.component'},
        {signature: 'Link', type: 'template.component'},
        {signature: 'transaction', type: 'transaction'}
      ]
      expect(trans.traces.length).toBe(expected.length)

      var actual = trans.traces.map(function(t) { return {signature: t.signature, type: t.type}})
      for(var i = 0; i < actual.length; i++ ){
        expect(actual[i]).toEqual(expected[i])
      }
    })

    trans.end()
  })
})


