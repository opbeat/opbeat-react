var React = require('react')

var mount = require('enzyme').mount
var unmount = require('enzyme').unmount

var makeSignatureFromRoutes = require('../../src/react/router').makeSignatureFromRoutes
var pushLocation = {action: 'PUSH'}
var replaceLocation = {action: 'REPLACE'}


var ServiceContainer = require('../../src/common/serviceContainer')
var ServiceFactory = require('../../src/common/serviceFactory')

var ReactRouter = require('react-router')
var browserHistory = ReactRouter.browserHistory
var Router = ReactRouter.Router
var Route = ReactRouter.Route
var Redirect = ReactRouter.Redirect
var utils = require('../../src/lib/utils')

var LoginComponent = React.createClass({
  componentDidMount: function () {
    browserHistory.push('/new-path')
  },
  render: function () {
    return React.createElement('div')
  }
})

describe('react-router: makeSignatureFromRoutes', function () {
  it('should correctly join paths', function () {
    var pushLocation = {
      action: 'PUSH'
    }

    var routes = [{path: '/'}]
    expect(makeSignatureFromRoutes(routes, pushLocation)).toBe('/')

    routes = [{path: '/'}, {path: '/something'}]
    expect(makeSignatureFromRoutes(routes, pushLocation)).toBe('/something')

    routes = [{path: '/'}, {path: 'something'}]
    expect(makeSignatureFromRoutes(routes, pushLocation)).toBe('/something')

    routes = [{path: '/'}, {path: '/'}, {path: '/'}, {path: 'something'}]
    expect(makeSignatureFromRoutes(routes, pushLocation)).toBe('/something')

    routes = [{path: '/'}, {path: '/'}, {path: '/something'}, {path: ''}]
    expect(makeSignatureFromRoutes(routes, pushLocation)).toBe('/something')
  })

  it('should handle zero routes', function () {
    expect(makeSignatureFromRoutes([], pushLocation)).toBe('unknown')
  })

  it('should handle REPLACE routes', function () {
    var routes = [{path: '/'}, {path: 'something'}]
    expect(makeSignatureFromRoutes(routes, replaceLocation)).toBe('/something (REPLACE)')
  })

  it('should handle nested routes', function () {
    var routes = [
      {path: 'company'},
      {path: ':companyId/tasks'},
      {path: ':taskListId'}
    ]

    expect(makeSignatureFromRoutes(routes, pushLocation)).toBe('/company/:companyId/tasks/:taskListId')
  })
})

describe('react-router: setTransactionName', function () {
  var transactionService
  var serviceContainer
  var tree
  var treeWrapper

  beforeEach(function () {
    serviceContainer = new ServiceContainer(new ServiceFactory())
    serviceContainer.initialize()
    utils.opbeatGlobal(serviceContainer)
    // Get rid of warning 'Location '/context.html''
    browserHistory.push('/')

    transactionService = serviceContainer.services.transactionService

    tree = React.createElement(
      Router, {history: browserHistory}, [
        React.createElement(Route, {path: '/', key: '0'}),
        React.createElement(Redirect, {from: '/old-path', to: '/new-path', key: '1'}),
        React.createElement(Route, {path: '/mypath', key: '2'}),
        React.createElement(Route, {path: '/new-path', key: '3'}),
        React.createElement(Route, {path: '/login', component: LoginComponent, key: '4'})
      ]
    )
  })

  it('should capture router change when mounted', function () {
    spyOn(transactionService, 'startTransaction').and.callThrough()

    serviceContainer.services.zoneService.runInOpbeatZone(function() {
      debugger;
      treeWrapper = mount(tree)

      expect(transactionService.startTransaction.calls.count()).toBe(1)
      expect(transactionService.startTransaction).toHaveBeenCalledWith('unknown', 'unknown')
      
      var lastTransaction = serviceContainer.services.zoneService.get('transaction')
      // has ended, so we can't use transactionService.getCurrentTransaction()
      expect(lastTransaction.name).toBe('/')
      expect(lastTransaction.type).toBe('route-change')
    })

  })


  it('should capture router change when it changes', function () {
    treeWrapper = mount(tree) // mount first, then add the spy

    spyOn(transactionService, 'startTransaction').and.callThrough()

    serviceContainer.services.zoneService.runInOpbeatZone(function() {
      browserHistory.push('/mypath')

      expect(transactionService.startTransaction.calls.count()).toBe(1)
      expect(transactionService.startTransaction).toHaveBeenCalledWith('unknown', 'unknown')

      // has ended, so we can't use transactionService.getCurrentTransaction()
      var lastTransaction = serviceContainer.services.zoneService.get('transaction')
      expect(lastTransaction.name).toBe('/mypath')
      expect(lastTransaction.type).toBe('route-change')
    })
  })

  it('should handle redirects', function () {
    treeWrapper = mount(tree)

    spyOn(transactionService, 'startTransaction').and.callThrough()

    serviceContainer.services.zoneService.runInOpbeatZone(function() {
      
      browserHistory.push('/login')

      expect(transactionService.startTransaction.calls.count()).toBe(2)

      // has ended, so we can't use transactionService.getCurrentTransaction()
      var lastTransaction = serviceContainer.services.zoneService.get('transaction')
      expect(lastTransaction.name).toBe('/new-path')
      expect(lastTransaction.type).toBe('route-change')
    })
  })

  afterEach(function () {
    if (transactionService) {
      var trans = transactionService.getCurrentTransaction()
      if (trans) trans.end()
    }

    if (treeWrapper) {
      treeWrapper.unmount()
    }
  })
})
