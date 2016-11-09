var frames = require('../exceptions/frames')
var traceCache = require('./traceCache')
var utils = require('../lib/utils')

function Trace (transaction, signature, type, options) {
  this.transaction = transaction
  this.signature = signature
  this.type = type
  this.ended = false
  this._parent = null
  this._diff = null
  this._end = null
  this._options = options

  if (utils.isUndefined(options) || options == null) {
    this._options = {}
  }
}

Trace.prototype.start = function () {
  // Start timers
  this._start = window.performance.now()

  var shouldGenerateStackFrames = this._options['enableStackFrames']

  if (shouldGenerateStackFrames) {
    this.captureTraceRawStackFrames()
  }
}

Trace.prototype.calcDiff = function () {
  // if (utils.isUndefined(this._end) || !this._start) {
    // return
  // }
  this._diff = this._end - this._start
}

Trace.prototype.end = function () {
  if (!this._end) {
    this._end = window.performance.now()
  }

  this.calcDiff()
  this.ended = true
  if (!utils.isUndefined(this.transaction) && typeof this.transaction._onTraceEnd === 'function') {
    this.transaction._onTraceEnd(this)
  }
}

Trace.prototype.duration = function () {
  this.calcDiff()
  return this._diff
}

Trace.prototype.startTime = function () {
  if (!this.ended || !this.transaction.ended) {
    return null
  }

  return this._start
}

Trace.prototype.ancestors = function () {
  var parent = this._parent
  var ancestors = []

  while (parent) {
    ancestors.push(parent.signature)
    parent = parent._parent
  }
  return ancestors.reverse()
}

Trace.prototype.parent = function () {
  return this._parent
}

Trace.prototype.setParent = function (val) {
  this._parent = val
}

Trace.prototype.getFingerprint = function () {
  var key = [this.transaction.name, this.signature, this.type]

  // Iterate over parents
  var prev = this._parent
  while (prev) {
    key.push(prev.signature)
    prev = prev._parent
  }

  return key.join('-')
}

Trace.prototype.captureTraceRawStackFrames = function (callback) {
  var key = this.getFingerprint()
  var traceFrames = traceCache.get(key)
  if (!traceFrames) {
    traceFrames = frames.getFramesForCurrent()
    traceCache.set(key, traceFrames)    
  }
  this._rawStackTrace = traceFrames 
}

Trace.prototype.resolveRawStackFrames = function () {
  var self = this
  return frames.resolveRawFrames(self._rawStackTrace).then(function(resolvedFrames) {
      self.frames = resolvedFrames
      self.frames.reverse() // Opbeat wants them reversed
  })
}

module.exports = Trace
