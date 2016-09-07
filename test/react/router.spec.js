var makeSignatureFromRoutes = require('../../src/react/router').makeSignatureFromRoutes
var pushLocation = {action: 'PUSH'}, replaceLocation = {action: 'REPLACE'}

describe("react: makeSignatureFromRoutes", function() {
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

    expect(makeSignatureFromRoutes(routes, pushLocation)).toBe("company/:companyId/tasks/:taskListId")
  })
})
