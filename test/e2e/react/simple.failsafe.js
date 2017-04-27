describe('failsafe react-app', function () {
  // Can't use utils.verifyNoBrowserErrors since console is not available in ie9

  it('should have no errors', function (done) {
    browser
      .url('/react/index.html')
      .executeAsync(
        function (cb) {
          var errors = []
          window.onerror = function (error, url, line) {
            errors.push(error)
            console.log(error)
          }
          setTimeout(function () {
            cb(errors)
          }, 1000)
        }
    ).then(function (response) {
      var errors = response.value
      expect(errors.length).toBe(0)

      done()
    }, function (error) {
      browser.log(error)
    })
  })
})
