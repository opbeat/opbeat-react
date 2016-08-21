var logLevels = {
  ALL: {value: Number.MIN_VALUE},
  DEBUG: {value: 700},
  INFO: {value: 800},
  WARNING: {value: 900},
  SEVERE: {value: 1000},
  OFF: {value: Number.MAX_VALUE}
}

var allowSomeBrowserErrors = function(allowedErrorText) {
  return function (done) {
    // TODO: Bug in ChromeDriver: Need to execute at least one command
    // so that the browser logs can be read out!
    browser.execute('1+1')
    browser.log('browser').then(function (response) {
      var filteredLog = []
      var infoLogs = []
      var browserLog = response.value
      for (var i = 0; i < browserLog.length; i++) {
        var logEntry = browserLog[i]
        if (logLevels[logEntry.level].value > logLevels.WARNING.value && (!allowedErrorText || logEntry.message.indexOf(allowedErrorText) > 0)) {
          filteredLog.push(logEntry)
        } else if (logLevels[logEntry.level].value >= logLevels.INFO.value) {
          infoLogs.push(logEntry)
        // console.log('>> ' + logEntry.message)
        }
      }
      if (filteredLog.length > 0) {
        console.log('Erros: ', filteredLog)
        console.log('infoLogs:', infoLogs)
      }
      expect(filteredLog.length).toEqual(0, 'Expected no errors in the browserLog but got ' + filteredLog.length + ' error(s)') // .because()
      if (typeof done === 'function') {
        done()
      }
    })
  }
}


var verifyNoBrowserErrors = allowSomeBrowserErrors()

module.exports = {
  verifyNoBrowserErrors: verifyNoBrowserErrors,
  allowSomeBrowserErrors: allowSomeBrowserErrors,
  expectTraceInGroups: function expectTraceInGroups (signature, count, groups) {
    var filtered = groups.filter(function (g) {
      return g.signature === signature
    })
    expect(filtered.length).toEqual(count, 'Expected ' + count + ' groups with signature == "' + signature + '" but got: ' + filtered.length)
  }
}
