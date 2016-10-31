var dynLoading = require('../../src/common/patches/fetchPatch').patchPromise
var ZoneService = require('../../src/transaction/zone_service')
var TransactionService = require('../../src/transaction/transaction_service')
var logger = require('loglevel')
var ServiceFactory = require('../../src/common/serviceFactory')


describe('detect script loading', function () {
  var transactionService
  var trace
  var currentTransaction
  var zoneService
  var serviceFactory = new ServiceFactory()

  beforeEach(function () {
    zoneService = new ZoneService(window.Zone.current, logger, serviceFactory.getConfigService())
    transactionService = new TransactionService(zoneService, logger, serviceFactory.getConfigService(), serviceFactory.getOpbeatBackend())
  })

  it('detects scripts added to HEAD with onerror handler', function (done) {
    var transaction = transactionService.startTransaction('trans1', 'test.trans') 

    zoneService.zone.run(function () {
      spyOn(transaction, 'addTask').and.callThrough()
      spyOn(transaction, 'startTrace').and.callThrough()
      var onerrorCalled = false
      var script = document.createElement('script')
      script.src = "not-existing.js"
      
      script.onload = function() { console.log('never called') }
      script.onerror = function () {
        onerrorCalled = true
        expect(transaction.startTrace).toHaveBeenCalledWith('http://localhost:9876/not-existing.js', 'resource.script')
        expect(transaction.ended).toBe(false)
        zoneService.runOuter(function() { setTimeout(cb, 0) })
      }
      document.head.appendChild(script)

      var cb = function () {
        expect(onerrorCalled).toBe(true)
        expect(Object.keys(transaction._activeTraces).length).toEqual(0)
        expect(Object.keys(transaction._scheduledTasks).length).toEqual(0)
        expect(transaction.ended).toBe(true)
        done()
      }
    })
  })

  it('detects scripts added to HEAD, then gets handler', function (done) {
    var onerrorCalled = false
    var transaction

    transaction = transactionService.startTransaction('trans1', 'test.trans') 

    zoneService.zone.run(function () {
      spyOn(transaction, 'addTask').and.callThrough()
      spyOn(transaction, 'startTrace').and.callThrough()
      
      var script = document.createElement('script')
      document.head.appendChild(script)

      setTimeout(setCallbacks, 0)

      function setCallbacks () {
        setTimeout(function () {
          script.onerror = function () {
            onerrorCalled = true
            expect(transaction.startTrace).toHaveBeenCalledWith('http://localhost:9876/not-existing.js', 'resource.script')
            expect(transaction.ended).toBe(false)
            zoneService.runOuter(function() {setTimeout(cb, 0) })
          }
          script.src = "not-existing.js"
        }, 0)
      }
    })

    var cb = function () {
        setTimeout(function () {
          setTimeout(function() {
            expect(onerrorCalled).toBe(true)
            expect(transaction.ended).toBe(true)
            expect(Object.keys(transaction._activeTraces).length).toEqual(0)
            expect(Object.keys(transaction._scheduledTasks).length).toEqual(0)
            done()
          }, 0)
        }, 0)
      }
  })

  // TODO: Setting src twice in the same tick causes the resource to show up with the last set src
  // while its actually the first one that gets downloaded.

  // it('ensures that updating `src` doesnt start new trace', function (done) {
  //   zoneService.zone.run(function () {
  //     var transaction = transactionService.startTransaction('trans1', 'test.trans') 
  //     spyOn(transaction, 'addTask').and.callThrough()
  //     spyOn(transaction, 'startTrace').and.callThrough()
  //     var onerrorCalled = false
  //     var script = document.createElement('script')
  //     document.head.appendChild(script)

  //     setTimeout(setCallbacks, 0)

  //     function setCallbacks () {
  //       script.src = "not-existing.js"
  //       script.src = "not-existing-2.js"

  //       script.onerror = function () {
  //         onerrorCalled = true
  //         expect(transaction.startTrace).toHaveBeenCalledWith('http://localhost:9876/not-existing.js', 'resource.script')
  //         expect(transaction.startTrace.calls.count()).toBe(0)
  //         setTimeout(cb, 0)
  //       }
  //     }

  //     var cb = function () {
  //       expect(onerrorCalled).toBe(true)
  //       expect(Object.keys(transaction._activeTraces).length).toEqual(0)
  //       transaction.end()
  //       done()
  //     }
  //   })
  // })
})
