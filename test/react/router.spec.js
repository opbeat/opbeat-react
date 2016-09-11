var React = require('react')

var mount = require('enzyme').mount

var makeSignatureFromRoutes = require('../../src/react/router').makeSignatureFromRoutes
var pushLocation = {action: 'PUSH'}, replaceLocation = {action: 'REPLACE'}
var patchRouter = require('../../src/react/router').patchRouter


var ServiceContainer = require('../../src/common/serviceContainer')
var ServiceFactory = require('../../src/common/serviceFactory')

var ReactRouter = require('react-router')
var browserHistory = ReactRouter.browserHistory,
    Router = ReactRouter.Router,
    Route = ReactRouter.Route,
    Redirect = ReactRouter.Redirect


describe("react-router: makeSignatureFromRoutes", function() {
  it("should correctly join paths", function() {
    var pushLocation = {
      action: 'PUSH'
    }

    var routes = [{path: "/"} ]
    expect(makeSignatureFromRoutes(routes, pushLocation)).toBe("/")

    routes = [{path: "/"}, {path: "/something"}, ]
    expect(makeSignatureFromRoutes(routes, pushLocation)).toBe("/something")
    
    routes = [{path: "/"}, {path: "something"}]
    expect(makeSignatureFromRoutes(routes, pushLocation)).toBe("/something")
  })

  it("should handle zero routes", function() {
    expect(makeSignatureFromRoutes([], pushLocation)).toBe("unknown")
  })

  it("should handle REPLACE routes", function() {
    var routes = [
      {path: "/"}, {path: "something"}, 
    ]
    expect(makeSignatureFromRoutes(routes, replaceLocation)).toBe("/something (REPLACE)")
  })

  it("should handle nested routes", function() {
    var routes = [
      {path: "company"},
      {path: ":companyId/tasks"},
      {path: ":taskListId"}
    ]

    expect(makeSignatureFromRoutes(routes, pushLocation)).toBe("/company/:companyId/tasks/:taskListId")
  })
})

describe("react-router: captureRouteChange", function() {
  serviceContainer = new ServiceContainer(new ServiceFactory())
  serviceContainer.initialize()

  var originalRouterPrototype = Router.prototype
  var transactionService


  var tree = React.createElement(
    Router, {history: browserHistory},
      [
        React.createElement(Redirect, {from: '/old-path', to: '/new-path'}),
        React.createElement(Route, {path: '/mypath'}),
        React.createElement(Route, {path: '/new-path'})
      ]
  )

  beforeEach(function () {
    transactionService = serviceContainer.services.transactionService
    spyOn(transactionService, 'startTransaction').and.callThrough()
    patchRouter(Router.prototype, serviceContainer)
    var wrapper = mount(tree);
  })

  it('should capture router change', function () {
    browserHistory.push('/mypath')

    expect(transactionService.startTransaction.calls.count()).toBe(1)
    expect(transactionService.startTransaction).toHaveBeenCalledWith('/mypath', 'spa.route-change')
  })

  afterEach(function() {
    Router.prototype = originalRouterPrototype
  })
})
