var utils = require('../../e2e/utils')

describe('redux-app', function () {
  // build the app
  beforeEach(utils.verifyNoBrowserErrors)

  it('should have correct number of transactions and traces', function (done) {
    browser.url('/react/redux/index.html')//wait(until.elementLocated(By.id('incr')))

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
        expect(transactions.traces.groups.length).toBe(2)

        expect(transactions.traces.groups[1].kind).toBe("template.update")

        expect(transactions.traces.raw.length).toBe(1)
        expect(transactions.traces.raw[0].length).toBe(3)
        expect(transactions.transactions.length).toBe(1)
        expect(transactions.transactions[0].transaction).toBe('INCREMENT')
        expect(transactions.transactions[0].kind).toBe('spa.action')
        done()
      }, function (error) {
        browser.log(error)
      })
  })


  it('dispatch outside render should work', function (done) {
    browser.url('/react/redux/index.html')//wait(until.elementLocated(By.id('incr')))

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

        expect(transactions.traces.groups[1].kind).toBe("template.update")

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

  afterEach(utils.verifyNoBrowserErrors)
})
