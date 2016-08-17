var utils = require('../e2e/utils')


describe('simple-fetch-app', function () {
  // build the app
  beforeEach(utils.verifyNoBrowserErrors)

  it('should have correct number of transactions and traces', function (done) {
    browser.url('/fetch/index.html')

    browser.executeAsync(
      function(cb) {
        window.opbeatTransport.subscribe(function(transactions) {
          cb(transactions)
        })
        // document.getElementById('incr').click()
        // console.log('clicked')
      }
    ).then(function (response) {
        var transactions = response.value
        // console.log(transactions)
        expect(transactions.traces.groups.length).toBe(3)

        expect(transactions.traces.groups[1].kind).toBe('ext.HttpRequest.fetch')
        expect(transactions.traces.groups[1].signature).toBe('GET ./test.json')

        expect(transactions.traces.groups[2].signature).toBe('important custom trace')
        expect(transactions.traces.groups[2].kind).toBe('template.custom')

        done()
      }, function (error) {
        browser.log(error)
      })
  })

  afterEach(utils.verifyNoBrowserErrors)
})
