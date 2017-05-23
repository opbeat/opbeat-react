var initOpbeat = require('../../src/react').configure
// var _setServiceContainer = require('../../src/react')._setServiceContainer
var getServiceContainer = require('../../src/react').getServiceContainer
var captureError = require('../../src/react').captureError
var createOpbeatMiddleware = require('../../src/redux').createOpbeatMiddleware
var createStore = require('redux').createStore


var TransportMock = require('../utils/transportMock')

initOpbeat({'orgId': '', 'appId': ''})

describe('react-redux: opbeatMiddleware', function () {
  var transactionService
  var store
  var testAction1 = {type: 'TEST_ACTION_1'}
  var testAction2 = {type: 'TEST_ACTION_2'}
  var middleware, count, api
  var serviceContainer = getServiceContainer()
  var originalTransport

  var nextMiddleware = function (api) {
    return function (next) {
      return function (action) {
        count++
        expect(action === testAction1 || action === testAction2).toBeTruthy()
        expect(next).toBe(null)
      }
    }
  }

  function testingMiddleware (api, expectedAction) {
    return function (next) {
      return function (action) {
        count++
        expect(action).toBe(expectedAction)
        expect(next).toBe(null)
      }
    }
  }

  beforeEach(function () {
    originalTransport = serviceContainer.services.opbeatBackend._transport
    serviceContainer.services.opbeatBackend._transport = new TransportMock()

    transactionService = serviceContainer.services.transactionService

    var reducer = function (state, action) { return state }
    store = createStore(reducer, {'hello': 'world'})

    middleware = createOpbeatMiddleware()
    count = 0

    api = {
      dispatch: store.dispatch,
      getState: store.getState
    }
  })

  it('should start transaction if none exists', function () {
    spyOn(transactionService, 'startTransaction').and.callThrough()

    expect(transactionService.startTransaction.calls.count()).toBe(0)
    expect(transactionService.getCurrentTransaction()).toBeUndefined()

    middleware(api)(nextMiddleware(api)(null))(testAction1)

    expect(transactionService.startTransaction).toHaveBeenCalledWith(testAction1.type, 'action')

    expect(count).toBe(1)
  })

  it('should start trace if transaction is already running', function () {
    serviceContainer.services.zoneService.runInOpbeatZone(function () {
      var transaction = transactionService.startTransaction('my-transaction', 'action')

      spyOn(transactionService, 'startTransaction').and.callThrough()
      spyOn(transaction, 'startTrace').and.callThrough()

      middleware(api)(nextMiddleware(api)(null))(testAction1)

      expect(transactionService.startTransaction).not.toHaveBeenCalled()
      expect(transaction.startTrace).not.toHaveBeenCalledWith(testAction1.type, 'action')

      expect(count).toBe(1)
      transaction.end()
    }
    )
  })

  xit('sends errors with store state', function (done) {
    var transport = serviceContainer.services.opbeatBackend._transport = new TransportMock()
    var configService = serviceContainer.services.configService
    configService.set('actionsCount', 10)
    configService.set('sendStateOnException', true)

    // must dispatch at least one action before our middleware will pick up
    middleware(api)(nextMiddleware(api)(null))(testAction1)
    middleware(api)(nextMiddleware(api)(null))(testAction2)
    middleware(api)(nextMiddleware(api)(null))(testAction1)

    expect(transport.errors).toEqual([])
    transport.subscribe(function (event, errorData) {
      if (event === 'sendError') {
        expect(errorData.data.message).toBe('Error: test error')
        expect(errorData.data.extra['Store state']).toEqual({ hello: 'world' })
        expect(errorData.data.extra['Last actions']).toEqual([ 'TEST_ACTION_1', 'TEST_ACTION_2', 'TEST_ACTION_1' ])
        done()
      }
    })
    var err = new Error('test error')
    captureError(err)
  })

  it('should support Objects as action.type', function () {
    spyOn(transactionService, 'startTransaction').and.callThrough()

    expect(transactionService.startTransaction.calls.count()).toBe(0)
    expect(transactionService.getCurrentTransaction()).toBeUndefined()

    var testObjectAction = {type: {test: 'TEST_OBJECT_ACTION'}}
    middleware(api)(testingMiddleware(api, testObjectAction)(null))(testObjectAction)
    expect(transactionService.startTransaction).toHaveBeenCalledWith('[object Object]', 'action')

    // need to end transaction manually since we're using singleton serviceContainer
    serviceContainer.services.zoneService.runInOpbeatZone(function () {
      var tr = transactionService.getCurrentTransaction()
      tr.end()
    })
    expect(count).toBe(1)
  })

  if (typeof Symbol === 'function') {
    it('should support Symbol as action.type', function () {
      spyOn(transactionService, 'startTransaction').and.callThrough()

      expect(transactionService.startTransaction.calls.count()).toBe(0)
      expect(transactionService.getCurrentTransaction()).toBeUndefined()

      var testSymbolAction = {type: Symbol.for('TEST_ACTION')}

      middleware(api)(testingMiddleware(api, testSymbolAction)(null))(testSymbolAction)
      expect(transactionService.startTransaction).toHaveBeenCalledWith('Symbol(TEST_ACTION)', 'action')

      expect(count).toBe(1)
    })
  } else {
    console.log('Symbol api is not supported. Ignoring test!')
  }

  afterEach(function () {
    serviceContainer.services.opbeatBackend._transport = originalTransport
  })
})
