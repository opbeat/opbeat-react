var patchPromise = require('../../src/common/patches/fetchPatch').patchPromise

function MockTrace (transactionService, signature, kind) {
  this.ended = false
  this.transactionService = transactionService

  this.signature = signature
  this.kind = kind
}

MockTrace.prototype.end = function () {
  this.ended = true
  this.transactionService.removeTrace(this)
}

function MockTransactionService () {
  this.traces = []
  this.tasks = []
}

MockTransactionService.prototype.startTrace = function (signature, kind) {
  var trace = new MockTrace(this, signature, kind)
  this.traces.push(trace)

  return trace
}

MockTransactionService.prototype.removeTrace = function (trace) {
  this.traces.splice(this.traces.indexOf(trace), 1)
}

MockTransactionService.prototype.addTask = function (taskId) {
  this.tasks.push(taskId)
}

MockTransactionService.prototype.removeTask = function (taskId) {
  if (this.tasks.indexOf(taskId) > -1) {
    this.tasks.splice(this.tasks.indexOf(taskId), 1)
  }
}

MockTransactionService.prototype.detectFinish = function () {
  return this.tasks.length === 0 && this.traces.length === 0
}


describe('patchPromise', function () {
  var funcs
  var transactionService
  var trace
  var p
  var p1
  var resolve, reject


  var explodeop = function() { throw 'Ouch!' }
  var noop = function() { }

  beforeEach(function () {
    funcs = {
      rejected: function (err) {
        expect(err).toBe('failure')
      }
    }

    transactionService = new MockTransactionService()
    trace = transactionService.startTrace('promise-start', 'promise')

    p = new Promise(function (onRes, onRej) {
      resolve = onRes
      reject = onRej
    })

    patchPromise(transactionService, p, trace, false)

    spyOn(funcs, 'rejected').and.callThrough()
    spyOn(transactionService, 'detectFinish').and.callThrough()
    spyOn(transactionService, 'addTask').and.callThrough()

    p1 = p.then(
      function (result) { expect(result).toBe('success') }, // never runs
      function (err) { 
        funcs.rejected(err)
        return 'test'
      }
    )
  })

  it('should not mess with standard functionality', function (done) {
    p1.then(function (arg) {
      // call rejected the right number of times
      expect(funcs.rejected.calls.count()).toEqual(1)
      expect(arg).toEqual('test')
      return 1
    }).then(function (value) {
      expect(value).toEqual(1)
      done()
    })

    reject('failure')
  })

  it('should work then "resolved" is null', function (done) {
    // Register some failure
    var p2 = p.then(null, funcs.rejected)

    Promise.all([p1, p2]).then(function () {
      expect(funcs.rejected.calls.count()).toEqual(2)
      done()
    })
    reject('failure')
  })

  it('should clear pending tasks (reject)', function (done) {
    // Register some failure
    var p2 = p.then(function () {}, function () {})

    Promise.all([p1, p2]).then(function () {
      expect(transactionService.addTask.calls.count()).toEqual(4)
      expect(transactionService.tasks.length).toEqual(0)
      done()
    })

    reject('failure')
  })


  it('should clear pending tasks (resolve)', function (done) {
    // Register some failure
    p.catch(funcs.rejected) // wont get called

    Promise.all([p1]).then(function () {
      expect(transactionService.addTask.calls.count()).toEqual(4)
      expect(transactionService.tasks.length).toEqual(0)
      done()
    })

    resolve('success')
  })


  it('should clear pending tasks (resolve) when a callback throws', function (done) {
    transactionService = new MockTransactionService()
    spyOn(transactionService, 'addTask').and.callThrough()

    trace = transactionService.startTrace('promise-start', 'promise')

    expect(transactionService.tasks.length).toEqual(0)

    // fresh promise with no pending listeners
    p = new Promise(function (onRes, onRej) {
      resolve = onRes
      reject = onRej
    })

    patchPromise(transactionService, p, trace, false)

    // wont get called, but we need to make sure we clean up the task even
    // when the first callback throws
    p1 = p.catch(funcs.rejected)

    var p2 = p.then(explodeop).catch(function () { })

    // We can't use chaining here, because that would leave some tasks
    // thus, we use Promise.all
    Promise.all([p2]).then(function () {
      expect(transactionService.addTask.calls.count()).toEqual(6)
      expect(transactionService.tasks.length).toEqual(0)
      done()
    })

    resolve('success')
  })


  it('should call detect finish after each resolve', function (done) {
    // Register some failure
    var p2 = p.then(null, funcs.rejected)
    var p3 = p.catch(funcs.rejected)

    Promise.all([p1, p2, p3]).then(function () {
      expect(transactionService.detectFinish.calls.count()).toEqual(4)
      expect(transactionService.tasks.length).toEqual(0)
      done()
    })

    resolve('success')
  })


  it('should call detect finish after each reject', function (done) {
    // Register some failure
    var p2 = p.then(null, funcs.rejected)
    var p3 = p.catch(funcs.rejected)

    Promise.all([p1, p2, p3]).then(function () {
      expect(transactionService.detectFinish.calls.count()).toEqual(7)
      expect(transactionService.tasks.length).toEqual(0)
      done()
    })

    reject('failure')
  })


  it('should handle null functions correctly', function (done) {
    var p2 = p.then(null, null)

    Promise.all([p1, p2]).then(function () {
      expect(transactionService.detectFinish.calls.count()).toEqual(3)
      expect(transactionService.tasks.length).toEqual(0)
      done()
    })
    resolve('success')
  })

  it('should handle chained promises', function (done) {
    transactionService = new MockTransactionService()
    spyOn(transactionService, 'addTask').and.callThrough()

    trace = transactionService.startTrace('promise-start', 'promise')

    expect(transactionService.tasks.length).toEqual(0)

    // fresh promise with no pending listeners
    p = new Promise(function (onRes, onRej) {
      resolve = onRes
      reject = onRej
    })

    patchPromise(transactionService, p, trace, false)

    // chain on the previous promise
    p1 = p.then(function () { console.log('never-called') })
    var p2 = p1.catch(function () {
      expect(transactionService.tasks.length).toEqual(4)
    })

    Promise.all([p2]).then(
      function () {
        // call rejected the right number of times
        expect(transactionService.tasks.length).toEqual(0)
        done()
      }
    )

    reject('failure')
  })

  it('should handle chained promises with catch', function (done) {
    transactionService = new MockTransactionService()
    spyOn(transactionService, 'addTask').and.callThrough()
    var catched = false
    trace = transactionService.startTrace('promise-start', 'promise')

    expect(transactionService.tasks.length).toEqual(0)

    // fresh promise with no pending listeners
    p = new Promise(function (onRes, onRej) {
      resolve = onRes
      reject = onRej
    })

    patchPromise(transactionService, p, trace, false)

    // chain on the previous promise
    var p1 = p.then(noop)
     .then(noop).then(noop)
     .catch(noop)

    Promise.all([p1]).then(
      function () {
        // call rejected the right number of times
        expect(transactionService.tasks.length).toEqual(0)
        done()
      }
    )

    resolve('failure')
  })
})
