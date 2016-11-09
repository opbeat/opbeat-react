var Trace = require('../transaction/trace')
var utils = require('../lib/utils')
var eventPairs = [
  ['domainLookupStart', 'domainLookupEnd', 'DNS lookup'],
  ['connectStart', 'connectEnd', 'Connect'],
  ['requestStart', 'responseStart', 'Sending and waiting for first byte'],
  ['responseStart', 'responseEnd', 'Downloading'],
  ['domLoading', 'domInteractive', 'Parsing'],
  ['domContentLoadedEventStart', 'domContentLoadedEventEnd', '"DOMContentLoaded" event handling'],
  ['loadEventStart', 'loadEventEnd', '"load" event handling'],
]

module.exports = function captureHardNavigation (transaction) {
  var serviceContainer = utils.opbeatGlobal()
  if (serviceContainer && transaction.wasHardNavigation && window.performance && window.performance.timing) {
    var baseTime = window.performance.timing.navigationStart
    var timings = window.performance.timing

    transaction._rootTrace._start = transaction._start = 0
    transaction.type = 'page-load'
    transaction.name += ' (initial page load)' // temporary until we support transaction types
    for(var i = 0; i < eventPairs.length; i++) {
      var transactionStart = eventPairs[0]
      if (timings[eventPairs[i][0]] && timings[eventPairs[i][1]]) {
        var trace = new Trace(transaction, eventPairs[i][2], "hard-navigation.browser-timing")
        trace._start = timings[eventPairs[i][0]] - baseTime
        trace._end = timings[eventPairs[i][1]] - baseTime
        trace.ended = true
        trace.setParent(transaction._rootTrace)
        trace.end()
      }
    }

    if (window.performance.getEntriesByType) {
      var entries = performance.getEntriesByType("resource")
      for(var i = 0; i < entries.length; i++) {
        var entry = entries[i]
        if (entry.initiatorType && entry.initiatorType == 'xmlhttprequest')
        {
          continue
        } else {
          var kind = 'resource'
          if (entry.initiatorType) {
            kind += '.' + entry.initiatorType
          }

          var trace = new Trace(transaction, entry.name, kind)
          trace._start = entry.startTime
          trace._end = entry.responseEnd
          trace.ended = true
          trace.setParent(transaction._rootTrace)
          trace.end()
        }
      }
    }

    transaction._adjustStartToEarliestTrace()
    transaction._adjustEndToLatestTrace()
  }
  return 0
}