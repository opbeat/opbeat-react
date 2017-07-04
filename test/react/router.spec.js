var React = require('react')

var mount = require('enzyme').mount
var unmount = require('enzyme').unmount

var makeSignatureFromRoutes = require('../../src/router').makeSignatureFromRoutes
var wrapRouter = require('../../src/router').wrapRouter
var pushLocation = {action: 'PUSH'}
var replaceLocation = {action: 'REPLACE'}

var initOpbeat = require('../../src/react').configure

var getServiceContainer = require('../../src/react').getServiceContainer

var ServiceContainer = require('opbeat-js-core').ServiceContainer
var ServiceFactory = require('opbeat-js-core').ServiceFactory

var ReactRouter = require('react-router')
var browserHistory = ReactRouter.browserHistory
var Router = ReactRouter.Router
var match = ReactRouter.match
var Route = ReactRouter.Route
var Redirect = ReactRouter.Redirect
var utils = require('../../src/utils')

var createReactClass = require('create-react-class')

var LoginComponent = createReactClass({
  componentDidMount: function () {
    browserHistory.push('/new-path')
  },
  render: function () {
    return React.createElement('div')
  }
})

const OpbeatRouter = wrapRouter(Router)

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

  it('should handle zero or undefined routes', function () {
    expect(makeSignatureFromRoutes([], pushLocation)).toBe('unknown')
    expect(makeSignatureFromRoutes(undefined, pushLocation)).toBe('unknown')
  })

  it('should handle REPLACE routes', function () {
    var routes = [{path: '/'}, {path: 'something'}]
    expect(makeSignatureFromRoutes(routes, replaceLocation)).toBe('/something')
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

  var routes = [
      React.createElement(Route, {path: '/', key: '0'}),
      React.createElement(Redirect, {from: '/old-path', to: '/new-path', key: '1'}),
      React.createElement(Route, {path: '/mypath', key: '2'}),
      React.createElement(Route, {path: '/new-path', key: '3'}),
      React.createElement(Route, {path: '/login', component: LoginComponent, key: '4'})
    ]

  beforeEach(function () {
    initOpbeat()
    serviceContainer = getServiceContainer()

    // Get rid of warning 'Location '/context.html''
    browserHistory.push('/')

    transactionService = serviceContainer.services.transactionService

    tree = React.createElement(
      OpbeatRouter, {history: browserHistory}, routes
    )
  })

  it('should capture router change when mounted', function () {
    var transaction
    var original = transactionService.startTransaction
    spyOn(transactionService, 'startTransaction').and.callFake(function() {
      transaction = original.apply(this, arguments)
      return transaction
    });


    serviceContainer.services.zoneService.runInOpbeatZone(function() {
      treeWrapper = mount(tree)

      expect(transactionService.startTransaction.calls.count()).toBe(1)
      expect(transactionService.startTransaction).toHaveBeenCalledWith('Unknown', 'route-change')

      expect(transaction.name).toBe('/')
      expect(transaction.type).toBe('route-change')
    })

  })


  it('should capture router change when it changes', function () {
    treeWrapper = mount(tree) // mount first, then add the spy

    spyOn(transactionService, 'startTransaction').and.callThrough()

    serviceContainer.services.zoneService.runInOpbeatZone(function() {
      browserHistory.push('/mypath')

      expect(transactionService.startTransaction.calls.count()).toBe(1)
      expect(transactionService.startTransaction).toHaveBeenCalledWith('Unknown', 'route-change')

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

  it('should capture router change when mounted with matchContext', function () {
    var transaction
    var original = transactionService.startTransaction
    spyOn(transactionService, 'startTransaction').and.callFake(function() {
      transaction = original.apply(this, arguments)
      return transaction
    });

    serviceContainer.services.zoneService.runInOpbeatZone(function() {
      match({ routes: routes, history: browserHistory}, (error, redirectLocation, renderProps) => {
        tree = React.createElement(
          OpbeatRouter, renderProps, routes
        )
        treeWrapper = mount(tree)
      });

      expect(transactionService.startTransaction.calls.count()).toBe(1)
      expect(transactionService.startTransaction).toHaveBeenCalledWith('Unknown', 'route-change')

      expect(transaction.name).toBe('/')
      expect(transaction.type).toBe('route-change')
    })
  })


  it('should capture router change when it changes with matchContext', function () {
    match({ routes: routes, history: browserHistory}, (error, redirectLocation, renderProps) => {
      tree = React.createElement(
        OpbeatRouter, renderProps, routes
      )
      treeWrapper = mount(tree)
    });

    var transaction
    var original = transactionService.startTransaction
    spyOn(transactionService, 'startTransaction').and.callFake(function() {
      transaction = original.apply(this, arguments)
      return transaction
    });

    serviceContainer.services.zoneService.runInOpbeatZone(function() {
      browserHistory.push('/mypath')

      var lastTransaction = serviceContainer.services.zoneService.get('transaction')
      expect(lastTransaction.name).toBe('/mypath')
      expect(lastTransaction.type).toBe('route-change')


      // expect(transactionService.startTransaction.calls.count()).toBe(1)
      // expect(transactionService.startTransaction).toHaveBeenCalledWith('Unknown', 'route-change')

      // expect(transaction.name).toBe('/')
      // expect(transaction.type).toBe('route-change')
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
