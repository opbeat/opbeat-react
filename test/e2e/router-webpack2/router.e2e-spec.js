// var utils = require('../utils')

// describe('router-app', function () {
//   // build the app
//   beforeEach(utils.verifyNoBrowserErrors)

//   it('should have correct number of transactions and traces', function (done) {
//     browser.url('/react/router/index.html')//wait(until.elementLocated(By.id('incr')))

//     browser.executeAsync(
//       function(cb) {
//         window.opbeatTransport.subscribe(function(transactions) {
//           console.log("BLEH")
//           cb(transactions)
//         })
//         document.getElementById('incr').click()
//         console.log('clicked')
//       }
//     ).then(function (response) {
//         var transactions = response.value
//         expect(transactions.traces.groups.length).toBe(1)
//         expect(transactions.traces.raw[0].length).toBe(2)
//         expect(transactions.transactions.length).toBe(1)
//         expect(transactions.transactions[0].transaction).toBe('INCREMENT')
//         expect(transactions.transactions[0].kind).toBe('spa.action')
//         done()
//       }, function (error) {
//         browser.log(error)
//       })
//   })

//   afterEach(utils.verifyNoBrowserErrors)
// })
