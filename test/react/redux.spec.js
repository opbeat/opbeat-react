var initOpbeat = require('../../src/react/react')
var createOpbeatMiddleware = require('../../src/react/redux').createOpbeatMiddleware
var createStore = require('redux').createStore

describe('react-redux: opbeatMiddleware', function () {
  var transactionService
  var opbeat
  var store
  var testAction = {type: 'TEST_ACTION'}
  var middleware, count, api

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
    opbeat = initOpbeat({
      'orgId': '470d9f31bc7b4f4395143091fe752e8c',
      'appId': '9aac8591bb'
    })
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

    expect(transactionService.startTransaction).toHaveBeenCalledWith(testAction.type, 'spa.action')

    expect(count).toBe(1)
  })

  it('should start trace if transaction is already running', function () {
    var transaction = transactionService.startTransaction('my-transaction', 'spa.action')

    spyOn(transactionService, 'startTransaction').and.callThrough()
    spyOn(transaction, 'startTrace').and.callThrough()

    middleware(api)(nextMiddleware(api)(null))(testAction)

    expect(transactionService.startTransaction).not.toHaveBeenCalled()
    expect(transaction.startTrace).not.toHaveBeenCalledWith(testAction.type, 'spa.action')

    expect(count).toBe(1)
  })
})
