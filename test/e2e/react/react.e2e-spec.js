var utils = require('../utils')

describe('react-app', function () {
  it('should have correct number of transactions and traces', function (done) {
    browser.url('/react/index.html')

    browser.executeAsync(
      function(cb) {
        window.opbeatTransport.subscribe(function(c, transactions) {
          cb(transactions.data)
        })
      }
    ).then(function (response) {
      var transactions = response.value
      expect(transactions.traces.groups.length).toBe(5)
      expect(transactions.traces.groups[1].kind).toBe("template.update")

      expect(transactions.traces.raw.length).toBe(1)
      expect(transactions.traces.raw[0].length).toBe(7)

      expect(transactions.transactions.length).toBe(1)
      expect(transactions.transactions[0].transaction).toBe('demo')
      done()
    }, utils.handleError(done))
  })


  it('should not create transaction for non-events', function (done) {
    browser.url('/react/index.html')

    browser.executeAsync(
      function(cb) {
        window.opbeatTransport.subscribe(function(c, transactions) {
          console.log("YOYOY! 2")
          cb(transactions.data)
        })

        document.getElementById('ES6Component').click()
      }
    ).then(function (response) {
        var transactions = response.value
        expect(transactions.traces.groups.length).toBe(5)
        expect(transactions.traces.groups[1].kind).toBe("template.update")

        expect(transactions.traces.raw.length).toBe(1)
        expect(transactions.traces.raw[0].length).toBe(7)

        expect(transactions.transactions.length).toBe(1)
        expect(transactions.transactions[0].transaction).toBe('demo')
        done()
      }, utils.handleError(done))
  })


  afterEach(utils.verifyNoBrowserErrors)
})
