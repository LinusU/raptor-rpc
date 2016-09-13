/* eslint-env mocha */

var dgram = require('dgram')
var helper = require('./_helper')

var PORT_CLIENT = 30100
var PORT_SERVER = 30101

describe('dgram', function () {
  var app = helper.app()
  var ee = helper.calls()

  var client = dgram.createSocket('udp4')
  var server = dgram.createSocket('udp4')

  ee.on('request', function (b) {
    client.send(b, 0, b.length, PORT_SERVER, 'localhost')
  })

  client.on('message', function (msg, rinfo) {
    ee.emit('remote', { type: 'dgram', port: PORT_CLIENT })
    ee.emit('response', msg)
  })

  before(function (done) {
    app.attach(server)

    client.bind(PORT_CLIENT, function () {
      server.bind(PORT_SERVER, done)
    })
  })

  ee.registerTests()

  after(function () {
    client.close()
    server.close()
  })
})
