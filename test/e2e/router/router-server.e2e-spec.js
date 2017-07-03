var utils = require('../utils')

describe('router-server', function () {
  it('should render the app', function (done) {
    browser.url('http://localhost:8001/router/')
      // .waitForExist('#hello')
      .getText('#router-app')
      .then(function (response) {
        expect(response.indexOf('APP!') >= 0).toBeTruthy()
        done()
      }, utils.handleError(done)).catch(utils.handleError(done))
  })
})
