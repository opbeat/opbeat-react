var utils = require('../utils')
var handleError = utils.handleError

describe('simple-fetch-app', function () {
  // build the app

  it('should intercept regular fetch', function (done) {
    browser.url('/fetch/index.html')
      .executeAsync(
        function (cb) {
          console.log('hello')
          if (!window.opbeatTransport) {
            throw new Error('window.opbeatTransport is undefined, readyState:' + document.readyState)
          }
          window.opbeatTransport.subscribe(function (c, transactions) {
            console.log('hello2')
            var fetchedResult = document.getElementById('fetchResult').textContent
            cb({transactions: transactions.data, fetchedResult: fetchedResult})
          })
          document.getElementById('fetch-data').click()
        }
    ).then(function (response) {
      var transactions = response.value.transactions
      var fetchedResult = response.value.fetchedResult
      expect(fetchedResult).toBe('some-data')

      expect(transactions.traces.groups.length).toBe(4)

      expect(transactions.traces.groups[0].transaction).toBe('fetchData')
      expect(transactions.traces.groups[0].kind).toBe('transaction')

      expect(transactions.traces.groups[1].kind).toBe('ext.HttpRequest.fetch')
      expect(transactions.traces.groups[1].signature).toBe('GET ./test.json')

      expect(transactions.traces.groups[2].signature).toBe('important custom trace')
      expect(transactions.traces.groups[2].kind).toBe('template.custom')

      expect(transactions.traces.groups[3].kind).toBe('template.component')
      expect(transactions.traces.groups[3].signature).toBe('component')

      // utils.verifyNoBrowserErrors(done)
      done()
    }, handleError(done)).catch(handleError(done))
  })

  it('should intercept fire-and-forget fetch', function (done) {
    browser.url('/fetch/index.html')

    browser.executeAsync(
      function (cb) {
        window.opbeatTransport.subscribe(function (c, transactions) {
          var fetchedResult = document.getElementById('fetchResult').textContent

          cb({transactions: transactions.data, fetchedResult: fetchedResult})
        })
        document.getElementById('fetch-data-fire-forget').click()
      }
    ).then(function (response) {
      var transactions = response.value.transactions
      var fetchedResult = response.value.fetchedResult
      expect(transactions.traces.groups.length).toBe(3)

      expect(transactions.traces.groups[0].transaction).toBe('fetchData')
      expect(transactions.traces.groups[0].kind).toBe('transaction')

      expect(transactions.traces.groups[1].kind).toBe('ext.HttpRequest.fetch.truncated')
      expect(transactions.traces.groups[1].signature).toBe('GET /slow-response')

      expect(transactions.traces.groups[2].kind).toBe('template.component')
      expect(transactions.traces.groups[2].signature).toBe('component')

      utils.verifyNoBrowserErrors(done)
    }, handleError(done)) // .catch(handleError(done))
  })

  it('should intercept rejected fetch', function (done) {
    browser.url('/fetch/index.html')
      .refresh()
      .executeAsync(
        function (cb) {
          window.opbeatTransport.subscribe(function (c, transactions) {
            cb({transactions: transactions.data})
          })
          document.getElementById('fail-fetch-data').click()
        }
    ).then(function (response) {
      try {
        var transactions = response.value.transactions

        expect(transactions.traces.groups.length).toBe(3)
        expect(transactions.traces.groups[0].transaction).toBe('failFetchData')
        expect(transactions.traces.groups[0].kind).toBe('transaction')

        expect(transactions.traces.groups[1].kind).toBe('ext.HttpRequest.fetch')
        expect(transactions.traces.groups[1].signature).toBe('GET http://non-existing-host.opbeat/non-existing-file.json')

        expect(transactions.traces.groups[2].signature).toBe('important reject trace')
        expect(transactions.traces.groups[2].kind).toBe('template.custom')
        utils.allowSomeBrowserErrors(['http://non-existing-host.opbeat/non-existing-file.json', 'Uncaught (in promise): TypeError: Failed to fetch', 'Unhandled Promise rejection'], done)
      } catch (e) {
        console.log(e, e.stack)
      }
    }, handleError(done)) // .catch(handleError(done))
  })

  it('should intercept catched fetch', function (done) {
    browser.url('/fetch/index.html')
      .refresh()
      .executeAsync(
        function (cb) {
          window.opbeatTransport.subscribe(function (c, transactions) {
            cb({transactions: transactions.data})
          })
          document.getElementById('fail-fetch-data-catch').click()
        }
    ).then(function (response) {
      var transactions = response.value.transactions
      expect(transactions.traces.groups.length).toBe(3)

      expect(transactions.traces.groups[0].transaction).toBe('failFetchDataWithCatch')
      expect(transactions.traces.groups[0].kind).toBe('transaction')

      expect(transactions.traces.groups[1].kind).toBe('ext.HttpRequest.fetch')
      expect(transactions.traces.groups[1].signature).toBe('GET http://non-existing-host.opbeat/non-existing-file.json')

      expect(transactions.traces.groups[2].signature).toBe('important catched trace')
      expect(transactions.traces.groups[2].kind).toBe('template.custom')
      utils.allowSomeBrowserErrors(['http://non-existing-host.opbeat/non-existing-file.json', 'Uncaught (in promise): TypeError: Failed to fetch', 'Unhandled Promise rejection'], done)
    }, handleError(done)).catch(handleError(done))
  })
})
