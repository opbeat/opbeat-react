var makeSignatureFromRoutes = require('../../src/react/router').makeSignatureFromRoutes

describe("makeSignatureFromRoutes", function() {
  it("should correctly join paths", function() {

    var routes = [
      {path: "/"}, {path: "/something"}, 
    ]

    expect(makeSignatureFromRoutes(routes)).toBe("/something")
    
    routes = [
      {path: "/"}, {path: "something"}, 
    ]

    expect(makeSignatureFromRoutes(routes)).toBe("/something")
  })

  it("should handle zero routes", function() {
    expect(makeSignatureFromRoutes([])).toBe("unknown")
  })
})