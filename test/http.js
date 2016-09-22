/* eslint-env mocha */

var http = require('http')
var assert = require('assert')
var createApp = require('./_app')
var requests = require('./_requests')
var getStream = require('get-stream')

var PORT = 30103

describe('http', function () {
  var app, id, server, localPort

  function send (obj) {
    return new Promise(function (resolve) {
      var client = http.request({ port: PORT }, function (res) {
        localPort = client.socket.localPort

        resolve(getStream(res).then(function (string) {
          return (string === '') ? null : JSON.parse(string)
        }))
      })

      var buf = new Buffer(JSON.stringify(obj))
      client.setHeader('Content-Length', buf.length)
      client.end(buf)
    })
  }

  before(function (done) {
    id = 0
    app = createApp()
    server = app.serve('http', PORT, done)
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

  it('should handle notifications', function () {
    var obj = { jsonrpc: '2.0', method: 'ping' }

    return send(obj).then(function (res) {
      assert.equal(res, null)
    })
  })

  it('should give remote information', function () {
    var obj = { jsonrpc: '2.0', method: 'remote', id: id++ }

    return send(obj).then(function (res) {
      assert.equal(res.result.type, 'http')
      assert.equal(res.result.port, localPort)
    })
  })
})
