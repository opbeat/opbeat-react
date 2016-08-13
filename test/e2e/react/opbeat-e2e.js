import createCreateStore from '../../../src/react/createStore'
import initOpbeat from  '../../../src/react/opbeat-react'
import ServiceFactory from '../../../src/common/serviceFactory'

function TransportMock (transport) {
  this._transport = transport
  this.transactions = []
}

TransportMock.prototype.sendTransaction = function (transactions) {
  var self = this
  this._transport.sendTransaction(transactions).then(function () {
      if (self.callback) {
        self.callback(transactions)
      }
    }, function (reason) {
      console.log('Failed to send to opbeat: ', reason)
    }
  )
}

TransportMock.prototype.subscribe = function (fn) {
  return this.callback = fn
}

var serviceFactory = new ServiceFactory()
var transport = serviceFactory.getTransport()
var transportMock = new TransportMock(transport)
serviceFactory.services['Transport'] = transportMock

window.opbeat = initOpbeat({
  'debug': true,
  'logLevel': 'trace',
  'orgId': '470d9f31bc7b4f4395143091fe752e8c',
  'appId': '9aac8591bb'
}, serviceFactory) // Override service factory
window.opbeatTransport = transportMock

const createStore = createCreateStore(opbeat)

module.exports = {
  createStore
}