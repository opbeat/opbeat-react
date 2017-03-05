var utils = require('../utils')

describe('failsafe react-app', function () {
  // build the app
  beforeEach(utils.verifyNoBrowserErrors)

  it('should have no errors', function (done) {
    browser.url('/react/index.html')

    browser.executeAsync(
      function(cb) {
        render()
        cb()
      }
    ).then(function (response) {
        // var transactions = response.value
        // expect(transactions.traces.groups.length).toBe(2)
        // expect(transactions.traces.groups[1].kind).toBe("template.update")

        // expect(transactions.traces.raw.length).toBe(1)
        // expect(transactions.traces.raw[0].length).toBe(3)

        // expect(transactions.transactions.length).toBe(1)
        // expect(transactions.transactions[0].transaction).toBe('demo')
        done()
      }, function (error) {
        browser.log(error)
      })
  })

  afterEach(utils.verifyNoBrowserErrors)
})
