/* eslint-env mocha */

var net = require('net')
var assert = require('assert')
var createApp = require('./_app')
var requests = require('./_requests')
var getStream = require('get-stream')

var PORT = 30102

describe('net', function () {
  var app, id, server, localPort

  function send (obj) {
    return new Promise(function (resolve) {
      var client = net.connect({ allowHalfOpen: true, port: PORT }, function () {
        localPort = client.localPort
        client.end(new Buffer(JSON.stringify(obj)))
      })

      resolve(getStream(client).then(function (string) {
        return JSON.parse(string)
      }))
    })
  }

  before(function (done) {
    id = 0
    app = createApp()
    server = app.serve('net', PORT, done)
  })

  after(function (done) {
    server.close(done)
  })

  requests.forEach(function (request) {
    it('should handle ' + request[0], function () {
      var obj = { jsonrpc: '2.0', method: request[0], params: request[1], id: id++ }

      return send(obj).then(request[2])
    })
  })

  it('should give remote information', function () {
    var obj = { jsonrpc: '2.0', method: 'remote', id: id++ }

    return send(obj).then(function (res) {
      assert.equal(res.result.type, 'net')
      assert.equal(res.result.port, localPort)
    })
  })
})
