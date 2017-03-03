var expect = require('chai').expect
var util = require('./util')

describe('The http util module', function () {
  describe('#formatDataUrl', function () {
    it('substitutes the data part', function () {
      var url = '/image?data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAAD///+l2Z/dAAAAM0lEQVR4nGP4/5/h/1+G/58ZDrAz3D/McH8yw83NDDeNGe4Ug9C9zwz3gVLMDA/A6P9/AFGGFyjOXZtQAAAAAElFTkSuQmCC'
      var formatted = util.formatDataUrl(url)
      expect(formatted).to.eql('/image?data:image/png;base64,{data}')
    })
    it('doesn\'t touch non-data urls', function () {
      var url = '/image?data=4'
      var formatted = util.formatDataUrl(url)
      expect(formatted).to.eql(url)
    })
  })
})
