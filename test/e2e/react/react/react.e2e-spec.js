var utils = require('../../e2e/utils')

var until = browser.until,
      By = browser.By;



describe('redux.app', function () {
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
      }
    ).then(function (response) {
        var transactions = response.value
        expect(transactions.traces.groups.length).toBe(2)
        expect(transactions.traces.raw[0].length).toBe(2)
        expect(transactions.transactions.length).toBe(1)
        expect(transactions.transactions[0].transaction).toBe('INCREMENT')
        expect(transactions.transactions[0].kind).toBe('spa.action')
        done()
      }, function (error) {
        browser.log(error)
      })
  })

  afterEach(utils.verifyNoBrowserErrors)
})
