/* eslint-env mocha */

var net = require('net')
var helper = require('./_helper')

var PORT = 30102

describe('net', function () {
  var app = helper.app()
  var ee = helper.calls()
  var server = net.createServer({ allowHalfOpen: true })

  ee.on('request', function (b) {
    var client = new net.Socket({ allowHalfOpen: true })

    client.connect(PORT, function () {
      client.end(b)
    })

    client.on('data', function (b) {
      ee.emit('remote', { type: 'net', port: client.localPort })
      ee.emit('response', b)
    })
  })

  before(function (done) {
    app.attach(server)
    server.listen(PORT, done)
  })

  ee.registerTests()

  after(function (done) {
    server.close(done)
  })
})
