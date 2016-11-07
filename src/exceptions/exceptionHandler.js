var stackTrace = require('./stacktrace')
var frames = require('./frames')
var utils = require('../lib/utils')


var ExceptionHandler = function (opbeatBackend, config, logger) {
  this._opbeatBackend = opbeatBackend
  this._config = config
  this._logger = logger
}

ExceptionHandler.prototype.install = function () {
  window.onerror = function (msg, file, line, col, error) {
    this._processError(error, msg, file, line, col)
  }.bind(this)

  if (typeof Error !== 'undefined') {
    Error.stackTraceLimit = this._config.get('stackTraceLimit')
  }
}

ExceptionHandler.prototype.uninstall = function () {
  window.onerror = null
}

ExceptionHandler.prototype.processError = function (err) {
  return this._processError(err)
}

ExceptionHandler.prototype._processError = function processError (error, msg, file, line, col) {
  if (msg === 'Script error.' && !file) {
    // ignoring script errors: See https://github.com/getsentry/raven-js/issues/41
    return
  }

  var exception = {
    'message': error ? error.message : msg,
    'type': error ? error.name : null,
    'fileurl': file || null,
    'lineno': line || null,
    'colno': col || null
  }

  if (!exception.type) {
    // Try to extract type from message formatted like 'ReferenceError: Can't find variable: initHighlighting'
    if (exception.message.indexOf(':') > -1) {
      exception.type = exception.message.split(':')[0]
    }
  }

  var stackFrames

  if (error) {
    stackFrames = stackTrace.fromError(error)
  } else {
    stackFrames = [{
        'fileName': file,
        'lineNumber': line,
        'columnNumber': col
      }]
  }

  var exceptionHandler = this
  exception.stack = stackFrames || []

  var store = this._config.get('redux._store')
  var actionBuffer = this._config.get('redux._lastActions')
  var reactContext = {}

  if (store) {
    reactContext['Store state'] = store.getState()
  }

  if (actionBuffer) {
    reactContext['Last ' + exceptionHandler._config.get('redux.actionsCount') + ' actions'] = actionBuffer.getAll()
  }

  return frames.stackInfoToOpbeatException(exception).then(function (exception) {
    var extraContext = utils.mergeObject(exceptionHandler._config.get('context.extra'), reactContext)

    var data = frames.processOpbeatException(
      exception,
      exceptionHandler._config.get('context.user'),
      extraContext
    )
    exceptionHandler._opbeatBackend.sendError(data)
  })['catch'](function (error) {
    exceptionHandler._logger.debug(error)
  })
}

module.exports = ExceptionHandler
