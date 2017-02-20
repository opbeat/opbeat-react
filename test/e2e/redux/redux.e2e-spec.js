var utils = require('../utils')

describe('redux-app', function () {
  it('should have correct number of transactions and traces', function (done) {
    browser.url('/redux/index.html')
    browser.executeAsync(
      function(cb) {
        console.log("subscribing")
          window.opbeatTransport.subscribe(function(c, transactions) {
            cb(transactions)
          })
          document.getElementById('incr').click();
      }
    ).then(function (response) {
        var transactions = response.value
        expect(transactions.traces.groups.length).toBe(3)

        expect(transactions.traces.groups[2].kind).toBe('template.component')
        expect(transactions.traces.groups[1].kind).toBe('action')

        expect(transactions.traces.raw.length).toBe(1)
        expect(transactions.traces.raw[0].length).toBe(5)
        expect(transactions.transactions.length).toBe(1)
        expect(transactions.transactions[0].transaction).toBe('IncrDecr p button#incr:click')
        expect(transactions.transactions[0].kind).toBe('interaction')

        utils.verifyNoBrowserErrors(done)

      }, utils.handleError(done))
  })


  it('dispatch outside render should work', function (done) {
    browser.url('/redux/index.html')

    browser.executeAsync(
      function(cb) {
        window.opbeatTransport.subscribe(function(c, transactions) {
          cb(transactions)
        })
        window.store.dispatch({type: 'DECREMENT'})
        console.log('DECREMENT')
      }
    ).then(function (response) {
        var transactions = response.value
        expect(transactions.traces.groups.length).toBe(3)

        expect(transactions.traces.groups[1].kind).toBe('template.component')

        expect(transactions.traces.raw.length).toBe(1)
        expect(transactions.traces.raw[0].length).toBe(5)
        expect(transactions.transactions.length).toBe(1)
        expect(transactions.transactions[0].transaction).toBe('DECREMENT')
        expect(transactions.transactions[0].kind).toBe('action')
        utils.verifyNoBrowserErrors()
        done()
      }, utils.handleError(done))
  })


  it('deal correctly with thunk dispatchers', function (done) {
    browser.url('/redux/index.html')

    browser.executeAsync(
      function(cb) {
        window.opbeatTransport.subscribe(function(c, transactions) {
          cb(transactions)
        })
        document.getElementById('simpleThunkButton').click()
      }
    ).then(function (response) {
        var transactions = response.value
        
        expect(transactions.traces.groups.length).toBe(5)

        expect(transactions.traces.groups[0].kind).toBe('transaction')
        expect(transactions.traces.groups[0].signature).toBe('transaction')
        expect(transactions.traces.groups[0].transaction).toBe('IncrDecr p button#simpleThunkButton:click')
        
        expect(transactions.traces.groups[1].signature).toBe('predispatch trace')
        expect(transactions.traces.groups[1].kind).toBe('custom')

        expect(transactions.traces.groups[2].signature).toBe('dispatch INCREMENT')
        expect(transactions.traces.groups[2].kind).toBe('action')

        expect(transactions.traces.groups[3].signature).toBe('IncrDecr')
        expect(transactions.traces.groups[3].kind).toBe('template.component')

        expect(transactions.traces.groups[4].signature).toBe('dispatch DECREMENT')
        expect(transactions.traces.groups[4].kind).toBe('action')

        expect(transactions.traces.raw.length).toBe(1)
        expect(transactions.traces.raw[0].length).toBe(8)
        expect(transactions.transactions.length).toBe(1)
        expect(transactions.transactions[0].transaction).toBe('IncrDecr p button#simpleThunkButton:click')
        expect(transactions.transactions[0].kind).toBe('interaction')
        utils.verifyNoBrowserErrors(done)
      }, utils.handleError(done))
  })


  it('should not connect work with dispatches in async tasks that follow', function (done) {
    browser.url('/redux/index.html')

    browser.executeAsync(
      function(cb) {
        window.opbeatTransport.subscribe(function(c, transactions) {
          cb(transactions)
        })
        var elem = document.getElementsByClassName('delayedThunkButton')[0]
        elem.click()
      }
    ).then(function (response) {
        var transactions = response.value
        
        expect(transactions.transactions.length).toBe(1)
        expect(transactions.traces.groups.length).toBe(5)
        utils.verifyNoBrowserErrors(done)
      }, utils.handleError(done))
  })


  it('should pick up errors', function (done) {
    browser.url('/redux/index.html')

    browser.executeAsync(
      function(cb) {
        window.opbeatTransport.subscribe(function(c, error) {
          cb(error)
        })
        var elem = document.getElementsByClassName('showErroneousComponent')[0]
        elem.click()
      }
    ).then(function (response) {
        var data = response.value[0]
        expect(data.exception.type).toBe('Invariant Violation')
        expect(data.exception.value).toBe('ErroneousComponent(...): A valid React element (or null) must be returned. You may have returned undefined, an array or some other invalid object.')
        expect(data.culprit).toBe('react/redux/bundle.js')
        expect(data.stacktrace.frames.length).toBeGreaterThan(10)
        expect(data.stacktrace.frames[0].colno).toBe(3)
        expect(data.stacktrace.frames[0].lineno).toBe(248)
        expect(data.stacktrace.frames[0]['function']).toBe('<anonymous>')
        expect(data.stacktrace.frames[0].filename).toBe('')

        done()
      }, utils.handleError(done))
  })
})
