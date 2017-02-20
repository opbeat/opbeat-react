var wrapRouter = require('./router').wrapRouter
var opbeatReact = require('./react')

module.exports = {
  __esModule: true,
  default: opbeatReact.configure,
  setUserContext: opbeatReact.setUserContext,
  setExtraContext: opbeatReact.setExtraContext,
  captureError: opbeatReact.captureError,
  startTransaction: opbeatReact.startTransaction,
  setTransactionName: opbeatReact.setTransactionName,
  getServiceContainer: opbeatReact.getServiceContainer,
  wrapRouter: wrapRouter
}
