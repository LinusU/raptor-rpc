/* eslint-env mocha */

var dgram = require('dgram')
var assert = require('assert')
var createApp = require('./_app')
var requests = require('./_requests')

var PORT_CLIENT = 30100
var PORT_SERVER = 30101

describe('dgram', function () {
  var app, id, server, client

  function send (obj) {
    return new Promise(function (resolve) {
      if (obj.id !== undefined) {
        client.once('message', function (msg) {
          resolve(JSON.parse(msg.toString()))
        })
      }

      var buf = new Buffer(JSON.stringify(obj))
      client.send(buf, 0, buf.length, PORT_SERVER, 'localhost')

      if (obj.id === undefined) resolve(null)
    })
  }

  before(function () {
    id = 0
    app = createApp()

    server = dgram.createSocket('udp4')
    client = dgram.createSocket('udp4')

    app.attach(server)

    return Promise.all([
      new Promise(function (resolve) { server.bind(PORT_SERVER, resolve) }),
      new Promise(function (resolve) { client.bind(PORT_CLIENT, resolve) })
    ])
  })

  after(function () {
    return Promise.all([
      /* Node.js 0.12 doesn't support `.close(callback)` */
      new Promise(function (resolve) { server.on('close', resolve); server.close() }),
      new Promise(function (resolve) { client.on('close', resolve); client.close() })
    ])
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
      assert.equal(res.result.type, 'dgram')
      assert.equal(res.result.port, PORT_CLIENT)
    })
  })
})
