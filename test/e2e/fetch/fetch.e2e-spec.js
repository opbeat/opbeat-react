var utils = require('../e2e/utils')


describe('simple-fetch-app', function () {
  // build the app
  beforeEach(utils.verifyNoBrowserErrors)

  it('should have correct number of transactions and traces', function (done) {
    browser.url('/fetch/index.html')

    browser.executeAsync(
      function(cb) {
        window.opbeatTransport.subscribe(function(transactions) {
          console.log("BLEH")
          cb(transactions)
        })
        // document.getElementById('incr').click()
        // console.log('clicked')
      }
    ).then(function (response) {
        var transactions = response.value
        // console.log(transactions)
        expect(transactions.traces.groups.length).toBe(2)

        expect(transactions.traces.groups[1].kind).toBe('ext.Http')
        expect(transactions.traces.groups[1].signature).toBe('GET ./test.json')

        done()
      }, function (error) {
        browser.log(error)
      })
  })

  afterEach(utils.verifyNoBrowserErrors)
})
