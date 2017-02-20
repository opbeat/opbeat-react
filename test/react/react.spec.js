// Must be first
var reactInternals = require('../../src/reactInternals')

var React = require('react')
var ReactDOM = require('react-dom')
var ServiceContainer = require('opbeat-js-core').ServiceContainer
var ServiceFactory = require('opbeat-js-core').ServiceFactory
var getServiceContainer = require('../../src/react').getServiceContainer
var initOpbeat = require('../../src/react').configure
var utils = require('../../src/utils')
var components = require('./components.jsx')
var TransportMock = require('../utils/transportMock')

var captureError = require('../../src/react').captureError
var ListOfLists = components.ListOfLists

var mount = require('enzyme').mount
var patchReact = require('../../src/reactPatches')

var nodeName = utils.nodeName

var ComponentTree;

// needs tokens to pass "isValid"
initOpbeat({'orgId': '', 'appId': ''})
var serviceContainer = getServiceContainer()


reactInternals.ready(function(internals) {
  ComponentTree = internals.ComponentTree
  patchReact(internals, serviceContainer)
})

if (React.version.split('.')[0] > 0) {
  // Only works for 15.0+ React
  describe('react: nodeName', function () {
    it('gets the correct name for nested components', function () {
      var wrapper = mount(React.createElement(ListOfLists))
      var li = wrapper.find('li').node
      expect(nodeName(ComponentTree, li)).toBe('List ul li.item1')

      var p = wrapper.find('p').node
      expect(nodeName(ComponentTree, p)).toBe('ListOfLists div p#paragraph')

      // nested madness
      var span = wrapper.find('span.span1').node
      expect(span).toBeTruthy()
      expect(nodeName(ComponentTree, span)).toBe('Link span.span1')

      var span2 = wrapper.find('span.span2').node
      expect(span2).toBeTruthy()
      expect(nodeName(ComponentTree, span2)).toBe('Value div span.span2')
    })
  })
} else {
  // Special case for React 0.14.x
  describe('react: nodeName', function () {
    it('gets the correct name for nested components', function () {
      var wrapper = mount(React.createElement(ListOfLists))
      var li = wrapper.find('li').node
      expect(nodeName(ComponentTree, li)).toBe('li.item1')

      var p = wrapper.find('p').node
      expect(nodeName(ComponentTree, p)).toBe('p#paragraph')

      // nested madness
      var span = wrapper.find('span.span1').node
      expect(span).toBeTruthy()
      expect(nodeName(ComponentTree, span)).toBe('span.span1')

      var span2 = wrapper.find('span.span2').node
      expect(span2).toBeTruthy()
      expect(nodeName(ComponentTree, span2)).toBe('span.span2')
    })
  })  
}

describe('react: generate traces', function () {
  var transactionService

  it('gets the correct name for nested components', function () {
    transactionService = serviceContainer.services.transactionService
    serviceContainer.services.zoneService.runInOpbeatZone(function() {
      var trans = transactionService.startTransaction('react-component-test', 'test')
      var wrapper = mount(React.createElement(ListOfLists))
      var expected
      
      if (React.version.split('.')[0] > 0) {    
        // with react <15.4, enzyme will add a wrapper here.
        expected = [
          {signature: 'ListOfLists', type: 'template.component'},
          {signature: 'transaction', type: 'transaction'}
        ]
      } else {
        expected = [
          {signature: 'Constructor', type: 'template.component'}, // Enzyme adds a wrapper :/
          {signature: 'transaction', type: 'transaction'}
        ]

      }
      expect(trans.traces.length).toBe(expected.length)

      var actual = trans.traces.map(function(t) { return {signature: t.signature, type: t.type}})
      for(var i = 0; i < actual.length; i++ ){
        expect(actual[i]).toEqual(expected[i])
      }
      trans.end()
    })

  })
})


describe('react: send error', function () {
  var transport

  it('sends errors', function () {
    var origTransport = getServiceContainer().services.opbeatBackend._transport
    transport = serviceContainer.services.opbeatBackend._transport = new TransportMock()
    expect(transport.errors).toEqual([])
    transport.subscribe(function (event, errorData) {
      if (event === 'sendError') {
        expect(errorData.data.message).toBe('Error: test error')
        done()
      }
    })
    captureError(new Error('test error'))
    serviceContainer.services.opbeatBackend._transport = origTransport
  })
})


