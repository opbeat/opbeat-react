var utils = require('../../e2e/utils')

describe('no-init', function () {
  it('should disable when not initialized', function (done) {
    browser.url('/react/no-init/index.html')

    browser.executeAsync(
      function(cb) {
        document.getElementById('hello').click()
        cb()
      }
    ).then(function () {
      done()
      }, function (error) {
        browser.log(error)
      })
  })

  afterEach(utils.verifyNoBrowserErrors)
})
