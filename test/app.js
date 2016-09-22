/* eslint-env mocha */

var assert = require('assert')
var createApp = require('./_app')
var requests = require('./_requests')

describe('app', function () {
  var app, id

  before(function () {
    id = 0
    app = createApp()
  })

  requests.forEach(function (request) {
    it('should handle ' + request[0], function () {
      var obj = { jsonrpc: '2.0', method: request[0], params: request[1], id: id++ }

      return app.connection().handleObject(obj).then(request[2])
    })
  })

  it('should give remote information', function () {
    var obj = { jsonrpc: '2.0', method: 'remote', id: id++ }

    return app.connection().handleObject(obj).then(function (res) {
      assert.equal(res.result.type, 'unknown')
      assert.equal(res.result.port, undefined)
    })
  })
})
