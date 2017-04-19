var logLevels = {
  ALL: {value: Number.MIN_VALUE},
  DEBUG: {value: 700},
  INFO: {value: 800},
  WARNING: {value: 900},
  SEVERE: {value: 1000},
  OFF: {value: Number.MAX_VALUE}
}

var debugMode = false
var debugLevel = logLevels.INFO.value
function assertNoBrowserErrors (whitelist, done) {
  // TODO: Bug in ChromeDriver: Need to execute at least one command
  // so that the browser logs can be read out!
  browser.execute('1+1')
  browser.log('browser').then(function (response) {
    var failureEntries = []
    var debugLogs = []
    var browserLog = response.value

    for (var i = 0; i < browserLog.length; i++) {
      var logEntry = browserLog[i]
      if (isLogEntryATestFailure(logEntry, whitelist)) {
        failureEntries.push(logEntry)
      }
      if (logLevels[logEntry.level].value >= debugLevel) {
        debugLogs.push(logEntry)
      }
    }

    if (failureEntries.length > 0 || debugMode) {
      console.log('------------> FailuresLogs')
      console.log(failureEntries)
      console.log('------------> debugLogs')
      console.log(debugLogs)
    }

    expect(failureEntries.length).toEqual(0, 'Expected no errors in the browserLog but got ' + failureEntries.length + ' error(s)') // .because()
    if (typeof done === 'function') {
      done()
    } else if (debugMode) {
      console.log('done is not a function')
    }
  })
}

function isLogEntryATestFailure (entry, whitelist) {
  var result = false
  if (logLevels[entry.level].value > logLevels.WARNING.value) {
    result = true
    if (whitelist) {
      for (var i = 0, l = whitelist.length; i < l; i++) {
        if (entry.message.indexOf(whitelist[i]) !== -1) {
          result = false
          break
        }
      }
    }
  }
  return result
}
module.exports = {
  allowSomeBrowserErrors: assertNoBrowserErrors,
  verifyNoBrowserErrors: function verifyNoBrowserErrors (done) {
    return assertNoBrowserErrors([], done)
  },
  handleError: function handleError (done) {
    return function (error) {
      console.log(error, error.stack)
      if (error.message.indexOf('received Inspector.detached event') === -1) {
        done.fail(error)
      }
    // done()
    }
  }
}
