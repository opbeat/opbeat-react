import initOpbeat from  '../../../dist/opbeat-react'
import ServiceFactory from '../../../src/common/serviceFactory'

function TransportMock (transport) {
  this._transport = transport
  this.transactions = []
  this._queued = []
}

TransportMock.prototype.sendTransaction = function (transactions) {
  var self = this
  this._transport.sendTransaction(transactions).then(function () {
      if (self.callback) {
        self.callback(transactions)
      }else{
        self._queued.push(transactions)
      }
    }, function (reason) {
      console.log('Failed to send to opbeat: ', reason)
    }
  )
}

TransportMock.prototype.subscribe = function (fn) {
  this.callback = fn
  console.log("subscribe")

  if (this._queued.length > 0) {
    console.log("Sending queued")
    fn(self._queued[0])
  }
}

var serviceFactory = new ServiceFactory()
var transport = serviceFactory.getTransport()
var transportMock = new TransportMock(transport)
serviceFactory.services['Transport'] = transportMock

var opbeat = initOpbeat({
  'debug': true,
  'logLevel': 'trace',
  'orgId': '470d9f31bc7b4f4395143091fe752e8c',
  'appId': '9aac8591bb'
}, serviceFactory) // Override service factory

if(typeof window !== 'undefined') {
  window.opbeatTransport = transportMock
  window.opbeat = opbeat
}
