var utils = require('../../e2e/utils')

describe('react-app', function () {
  // build the app
  beforeEach(utils.verifyNoBrowserErrors)

  it('should have correct number of transactions and traces', function (done) {
    browser.url('/react/react/index.html')//wait(until.elementLocated(By.id('incr')))

    browser.executeAsync(
      function(cb) {
        window.opbeatTransport.subscribe(function(transactions) {
          console.log("sending!", transactions)
          cb(transactions)
        })

        render()
      }
    ).then(function (response) {
        var transactions = response.value
        expect(transactions.traces.groups.length).toBe(2)
        expect(transactions.traces.groups[1].kind).toBe("template.update")

        expect(transactions.traces.raw.length).toBe(1)
        expect(transactions.traces.raw[0].length).toBe(4)

        expect(transactions.transactions.length).toBe(1)
        expect(transactions.transactions[0].transaction).toBe('demo')
        done()
      }, function (error) {
        browser.log(error)
      })
  })


  it('should not create transaction for non-events', function (done) {
    browser.url('/react/react/index.html')//wait(until.elementLocated(By.id('incr')))

    browser.executeAsync(
      function(cb) {
        render()

        window.opbeatTransport.subscribe(function(transactions) {
          cb(transactions)
        })

        document.getElementById('ES6Component').click()
      }
    ).then(function (response) {
        var transactions = response.value
        expect(transactions.traces.groups.length).toBe(2)
        expect(transactions.traces.groups[1].kind).toBe("template.update")

        expect(transactions.traces.raw.length).toBe(1)
        expect(transactions.traces.raw[0].length).toBe(4)

        expect(transactions.transactions.length).toBe(1)
        expect(transactions.transactions[0].transaction).toBe('demo')
        done()
      }, function (error) {
        browser.log(error)
      })
  })


  afterEach(utils.verifyNoBrowserErrors)
})
