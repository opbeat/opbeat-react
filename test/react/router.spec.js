var makeSignatureFromRoutes = require('../../src/react/router').makeSignatureFromRoutes
var pushLocation = {action: 'PUSH'}, replaceLocation = {action: 'REPLACE'}

describe("react: makeSignatureFromRoutes", function() {
  it("should correctly join paths", function() {

    var routes = [
      {path: "/"}, {path: "/something"}, 
    ]

    var pushLocation = {
      action: 'PUSH'
    }

    expect(makeSignatureFromRoutes(routes, pushLocation)).toBe("/something")
    
    routes = [
      {path: "/"}, {path: "something"}, 
    ]

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
})
