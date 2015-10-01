var exceptions = require('./lib/exceptions')
var logger = require('./lib/logger')
var utils = require('./lib/utils')
var config = require('./lib/config')

function Opbeat () {
  this.isInstalled = false

  this.install()
}

Opbeat.prototype.VERSION = '0.0.1'

Opbeat.prototype.isPlatformSupport = function () {
  return typeof Array.prototype.forEach === 'function' &&
    typeof JSON.stringify === 'function' &&
    typeof Function.bind === 'function' &&
    utils.isCORSSupported()
}

/*
 * Configure Opbeat with Opbeat.com credentials and other options
 *
 * @param {object} options Optional set of of global options
 * @return {Opbeat}
 */

Opbeat.prototype.config = function (properties) {
  config.setConfig(properties)

  return this
}

/*
 * Installs a global window.onerror error handler
 * to capture and report uncaught exceptions.
 * At this point, install() is required to be called due
 * to the way TraceKit is set up.
 *
 * @return {Opbeat}
 */

Opbeat.prototype.install = function () {
  if (!this.isPlatformSupport()) {
    return this
  }

  config.init()

  if (!config.isValid()) {
    return this
  }

  if (this.isInstalled) {
    return this
  }

  exceptions.install()

  this.isInstalled = true

  return this

}

/*
 * Uninstalls the global error handler.
 *
 * @return {Opbeat}
 */
Opbeat.prototype.uninstall = function () {
  exceptions.uninstall()

  this.isInstalled = false

  return this
}

/*
 * Manually capture an exception and send it over to Opbeat.com
 *
 * @param {error} ex An exception to be logged
 * @param {object} options A specific set of options for this error [optional]
 * @return {Opbeat}
 */
Opbeat.prototype.captureException = function (ex, options) {
  if (!this.isInstalled) {
    throw new Error("Can't capture exception. Opbeat isn't intialized")
  }

  if (!(ex instanceof Error)) {
    throw new Error("Can't capture exception. Passed exception needs to be an instanceof Error")
  }

  // TraceKit.report will re-raise any exception passed to it,
  // which means you have to wrap it in try/catch. Instead, we
  // can wrap it here and only re-raise if TraceKit.report
  // raises an exception different from the one we asked to
  // report on.

  exceptions.processError(ex, options)

  return this
}

/*
 * Set/clear a user to be sent along with the payload.
 *
 * @param {object} user An object representing user data [optional]
 * @return {Opbeat}
 */
Opbeat.prototype.setUserContext = function (user) {
  config.set('context.user', user)

  return this
}

/*
 * Set extra attributes to be sent along with the payload.
 *
 * @param {object} extra An object representing extra data [optional]
 * @return {Opbeat}
 */
Opbeat.prototype.setExtraContext = function (extra) {
  config.set('context.extra', extra)

  return this
}

module.exports = new Opbeat()
