var utils = require('../utils')

describe('router-app', function () {
  it('should send one transaction on load', function (done) {
    browser.url('/router/')

    browser.executeAsync(
      function(cb) {
        window.opbeatTransport.subscribe(function(c, transactions) {
          console.log("BLEH")
          cb(transactions.data)
        })
      }
    ).then(function (response) {
        var transactions = response.value
        
        expect(transactions.transactions.length).toBe(1)

        var expected = ['transaction',
          'Sending and waiting for first byte',
          'Fetching, parsing and sync. execution',
          'http://localhost:8000/router/bundle.js',
          'Provider',
          'dispatch START_LOAD_THING',
          'GET /slow-response',
          'Router',
          'dispatch FINSIHED_LOAD_THING'
        ]
        
        var signatures = transactions.traces.groups.map(t => t.signature)

        function rmItem(item) {
          var entryIdx = signatures.indexOf(item)

          if (entryIdx > -1) {
            signatures.splice(entryIdx, 1)
          }
        }
        
        // These show up intermittently
        rmItem('Downloading')
        rmItem('DNS') 

        expect(transactions.traces.groups.length).toBe(10)
        expect(signatures.sort()).toEqual(expected.sort())
        
        done() 
      }, utils.handleError(done)).catch(utils.handleError(done))
  })
})
