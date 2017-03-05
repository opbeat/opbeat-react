var utils = require('../utils')

describe('react-app', function () {
  it('should have the correct number of traces', function (done) {
    browser.url('/react/index.html')

    browser.executeAsync(
      function(cb) {
        window.opbeatTransport.subscribe(function(c, transactions) {
          cb(transactions.data)
        })

        document.getElementById('ES6Component').click()
      }
    ).then(function (response) {
        var transactions = response.value
        expect(transactions.traces.groups.length).toBe(4)
        expect(transactions.traces.groups[1].kind).toBe("template.component")

        expect(transactions.traces.raw.length).toBe(1)
        expect(transactions.traces.raw[0].length).toBe(6)

        expect(transactions.transactions.length).toBe(1)
        expect(transactions.transactions[0].transaction).toBe('ES6Component span#ES6Component:click')
        done()
      }, utils.handleError(done))
  })

})
