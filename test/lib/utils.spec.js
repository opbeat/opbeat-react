var utils = require('../../src/lib/utils')

describe('lib/utils', function () {
  it('should merge objects', function () {
    var result = utils.merge({a: 'a'}, {b: 'b', a: 'b'})
    expect(result).toEqual(Object({a: 'b', b: 'b'}))

    var deepMerged = utils.merge({a: {c: 'c'}}, {b: 'b', a: {d: 'd'}})
    expect(deepMerged).toEqual(Object({a: Object({c: 'c', d: 'd'}), b: 'b'}))

    var a = {a: {c: 'c'}}
    deepMerged = utils.merge({}, a, {b: 'b', a: {d: 'd'}})
    expect(deepMerged).toEqual(Object({a: Object({c: 'c', d: 'd'}), b: 'b'}))
    expect(a).toEqual(Object({a: Object({c: 'c'})}))

    deepMerged = utils.merge({a: {c: 'c'}}, {b: 'b', a: 'b'})
    expect(deepMerged).toEqual(Object({a: 'b', b: 'b'}))

    deepMerged = utils.merge({a: {c: 'c'}}, {b: 'b', a: null})
    expect(deepMerged).toEqual(Object({a: null, b: 'b'}))

    deepMerged = utils.merge({a: null}, {b: 'b', a: null})
    expect(deepMerged).toEqual(Object({a: null, b: 'b'}))
  })
})

describe('lib/utils - friendlyNodeName', function () {
  function testHTMLFriendlyName (html, friendlyName) {
    var div = document.createElement('div')
    div.innerHTML = html
    var element = div.firstChild
    expect(utils.friendlyNodeName(element)).toEqual(friendlyName)
  }

  it('should get a simple friendly name with id', function () {
    testHTMLFriendlyName('<button id="button1">text</button>', 'button#button1')
  })

  it('should get a simple friendly name with classes', function () {
    testHTMLFriendlyName('<button class="class1 class2">text</button>', 'button.class1.class2')
  })

  it('should get a simple friendly name with nothing', function () {
    testHTMLFriendlyName('<button>text</button>', 'button')
  })

  it('should get a simple friendly with weirdness', function () {
    testHTMLFriendlyName('<button id="  " class=" ">text</button>', 'button')
  })
})


describe('lib/utils - RingBuffer', function () {
  it('should work with when not full', function () {
    var r = new utils.RingBuffer(4)

    r.push(1)
    r.push(2)

    expect(r.getAll()).toEqual([1, 2])
  })

  it('should keep only X around', function () {
    var r = new utils.RingBuffer(4)

    r.push(1)
    r.push(2)
    r.push(3)
    r.push(4)
    r.push(5)

    expect(r.getAll()).toEqual([2, 3, 4, 5])
  })
})
