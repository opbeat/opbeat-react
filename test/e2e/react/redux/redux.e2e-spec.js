var utils = require('../../e2e/utils')

describe('redux-app', function () {
  beforeEach(utils.verifyNoBrowserErrors)

  it('should have correct number of transactions and traces', function (done) {
    browser.url('/react/redux/index.html')

    browser.executeAsync(
      function(cb) {
        window.opbeatTransport.subscribe(function(transactions) {
          cb(transactions)
        })
        document.getElementById('incr').click()
        console.log('clicked')
      }
    ).then(function (response) {
        var transactions = response.value
        expect(transactions.traces.groups.length).toBe(3)

        expect(transactions.traces.groups[1].kind).toBe('template.update')
        expect(transactions.traces.groups[2].kind).toBe('spa.dispatch')

        expect(transactions.traces.raw.length).toBe(1)
        expect(transactions.traces.raw[0].length).toBe(4)
        expect(transactions.transactions.length).toBe(1)
        expect(transactions.transactions[0].transaction).toBe('IncrDecr p button#incr:click')
        expect(transactions.transactions[0].kind).toBe('spa.action')
        done()
      }, function (error) {
        browser.log(error)
      })
  })


  it('dispatch outside render should work', function (done) {
    browser.url('/react/redux/index.html')

    browser.executeAsync(
      function(cb) {
        window.opbeatTransport.subscribe(function(transactions) {
          cb(transactions)
        })
        window.store.dispatch({type: 'DECREMENT'})
        console.log('DECREMENT')
      }
    ).then(function (response) {
        var transactions = response.value
        expect(transactions.traces.groups.length).toBe(2)

        expect(transactions.traces.groups[1].kind).toBe('template.update')

        expect(transactions.traces.raw.length).toBe(1)
        expect(transactions.traces.raw[0].length).toBe(3)
        expect(transactions.transactions.length).toBe(1)
        expect(transactions.transactions[0].transaction).toBe('DECREMENT')
        expect(transactions.transactions[0].kind).toBe('spa.action')
        done()
      }, function (error) {
        browser.log(error)
      })
  })


  it('deal correctly with thunk dispatchers', function (done) {
    browser.url('/react/redux/index.html')

    browser.executeAsync(
      function(cb) {
        window.opbeatTransport.subscribe(function(transactions) {
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
        
        expect(transactions.traces.groups[1].kind).toBe('template.update')

        expect(transactions.traces.groups[2].signature).toBe('predispatch trace')
        expect(transactions.traces.groups[2].kind).toBe('custom')

        expect(transactions.traces.groups[3].signature).toBe('dispatch INCREMENT')
        expect(transactions.traces.groups[3].kind).toBe('spa.dispatch')

        expect(transactions.traces.groups[4].signature).toBe('dispatch DECREMENT')
        expect(transactions.traces.groups[4].kind).toBe('spa.dispatch')

        expect(transactions.traces.raw.length).toBe(1)
        expect(transactions.traces.raw[0].length).toBe(7)
        expect(transactions.transactions.length).toBe(1)
        expect(transactions.transactions[0].transaction).toBe('IncrDecr p button#simpleThunkButton:click')
        expect(transactions.transactions[0].kind).toBe('spa.action')
        done()
      }, function (error) {
        browser.log(error)
      })
  })


  it('should not connect work with dispatches in async tasks that follow', function (done) {
    browser.url('/react/redux/index.html')

    browser.executeAsync(
      function(cb) {
        window.opbeatTransport.subscribe(function(transactions) {
          cb(transactions)
        })
        var elem = document.getElementsByClassName('delayedThunkButton')[0]
        elem.click()
      }
    ).then(function (response) {
        var transactions = response.value
        
        console.log(transactions.traces.raw)
        expect(transactions.transactions.length).toBe(1)

        expect(transactions.traces.groups.length).toBe(4)

        // expect(transactions.traces.groups[0].kind).toBe('transaction')
        // expect(transactions.traces.groups[0].signature).toBe('transaction')
        // expect(transactions.traces.groups[0].transaction).toBe('INCREMENT')

        // expect(transactions.traces.groups[1].kind).toBe('template.update')
        
        // expect(transactions.traces.groups[2].signature).toBe('predispatch trace')
        // expect(transactions.traces.groups[2].kind).toBe('custom')

        // expect(transactions.traces.groups[3].signature).toBe('dispatch DECREMENT')
        // expect(transactions.traces.groups[3].kind).toBe('app.action')

        // expect(transactions.traces.raw.length).toBe(5)
        // expect(transactions.traces.raw[0].length).toBe(3)
        // expect(transactions.transactions[0].transaction).toBe('INCREMENT')
        // expect(transactions.transactions[0].kind).toBe('spa.action')
        done()
      }, function (error) {
        browser.log(error)
      })
  })

  afterEach(utils.verifyNoBrowserErrors)
})
