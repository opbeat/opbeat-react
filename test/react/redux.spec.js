var initOpbeat = require('../../src/react/react').default
var captureError = require('../../src/react/react').captureError
var createOpbeatMiddleware = require('../../src/react/redux').createOpbeatMiddleware
var createStore = require('redux').createStore
var ServiceFactory = require('../../src/common/serviceFactory')
var TransportMock = require('../utils/transportMock')


describe('react-redux: opbeatMiddleware', function () {
  var transactionService
  var opbeat
  var store
  var testAction = {type: 'TEST_ACTION'}
  var middleware, count, api
  var serviceFactory

  var nextMiddleware = function (api) {
    return function (next) {
      return function (action) {
        count++
        expect(action).toBe(testAction)
        expect(next).toBe(null)
      }
    }
  }

  beforeEach(function () {
    serviceFactory = new ServiceFactory()
    serviceFactory.services['Transport'] = new TransportMock()

    opbeat = initOpbeat({
      'orgId': '470d9f31bc7b4f4395143091fe752e8c',
      'appId': '9aac8591bb'
    }, serviceFactory)
    transactionService = opbeat.services.transactionService
    
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

    middleware(api)(nextMiddleware(api)(null))(testAction)

    expect(transactionService.startTransaction).toHaveBeenCalledWith(testAction.type, 'dispatch.redux')

    expect(count).toBe(1)
  })

  it('should start trace if transaction is already running', function () {
    var transaction = transactionService.startTransaction('my-transaction', 'dispatch.redux')

    spyOn(transactionService, 'startTransaction').and.callThrough()
    spyOn(transaction, 'startTrace').and.callThrough()

    middleware(api)(nextMiddleware(api)(null))(testAction)

    expect(transactionService.startTransaction).not.toHaveBeenCalled()
    expect(transaction.startTrace).not.toHaveBeenCalledWith(testAction.type, 'dispatch.redux')

    expect(count).toBe(1)
    transaction.end()
  })

  it('sends errors with store state', function (done) {
    var transport = serviceFactory.services['Transport']
    expect(transport.errors).toEqual([])
    transport.subscribe(function (event, errorData) {
      if (event === 'sendError') {
        expect(errorData.data.message).toBe('Error: test error')
        expect(errorData.data.extra['Store state']).toEqual({ hello: 'world' })
        expect(errorData.data.extra['Last 10 actions']).toEqual([ 'TEST_ACTION' ])
        done()
      }
    })
    var err = new Error('test error')
    captureError(err)
  })
})
