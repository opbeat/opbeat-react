var utils = require('../../src/utils')


describe('utils - DOMNodeName', function () {
  function testHTMLFriendlyName (html, friendlyName) {
    var div = document.createElement('div')
    div.innerHTML = html
    var element = div.firstChild
    expect(utils.DOMNodeName(element)).toEqual(friendlyName)
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


describe('utils - RingBuffer', function () {
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
