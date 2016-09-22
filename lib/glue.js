var net = require('net')
var http = require('http')
var dgram = require('dgram')

function serve (raptor, type, port, cb) {
  var server

  switch (type) {
    case 'dgram':
      server = dgram.createSocket('udp4')
      server.bind(port, cb)
      break
    case 'http':
      server = http.createServer()
      server.listen(port, cb)
      break
    case 'net':
      server = net.createServer({ allowHalfOpen: true })
      server.listen(port, cb)
      break
    default:
      throw new Error('Unknown type: ' + type)
  }

  raptor.attach(server)
  return server
}

function handle (raptor, a0, a1) {
  if (
    a0 instanceof http.IncomingMessage &&
    a1 instanceof http.ServerResponse
  ) {
    // Express or Connect might
    // already have parsed the body

    var connection = raptor.connection(a0)

    var response
    if (Buffer.isBuffer(a0.body)) response = connection.handleBuffer(a0.body)
    else if (typeof a0.body === 'string') response = connection.handleString(a0.body)
    else if (typeof a0.body === 'object') response = connection.handleObject(a0.body)
    else response = connection.handleStream(a0)

    response
      .then(function (res) {
        if (res) {
          var b = new Buffer(JSON.stringify(res))
          a1.setHeader('Content-Length', b.length)
          a1.setHeader('Content-Type', 'application/json; charset=utf-8')
          a1.end(b)
        } else {
          a1.statusCode = 204
          a1.end()
        }
      })
      .catch(function (err) {
        setImmediate(function () { raptor.emit('error', err) })
      })

    return
  }

  if (a0 instanceof net.Socket) {
    raptor.connection(a0).handleStream(a0)
      .then(function (res) {
        if (res) {
          a0.end(new Buffer(JSON.stringify(res)))
        } else {
          a0.end()
        }
      })
      .catch(function (err) {
        setImmediate(function () { raptor.emit('error', err) })
      })

    return
  }

  raptor.emit('error', new Error('Unable to handle'))
}

function attach (raptor, server) {
  if (server instanceof http.Server) {
    server.on('request', raptor.handle)

    return
  }

  if (server instanceof net.Server) {
    server.on('connection', raptor.handle)

    return
  }

  if (server instanceof dgram.Socket) {
    server.on('message', function (msg, rinfo) {
      raptor.connection({ msg: msg, rinfo: rinfo }).handleBuffer(msg)
        .then(function (res) {
          var b = new Buffer(JSON.stringify(res))
          server.send(b, 0, b.length, rinfo.port, rinfo.address)
        })
        .catch(function (err) {
          setImmediate(function () { raptor.emit('error', err) })
        })
    })

    return
  }

  throw new Error('Unable to attach')
}

module.exports = function (raptor) {
  return {
    serve: function (type, port, cb) { return serve(raptor, type, port, cb) },
    handle: function (a0, a1) { handle(raptor, a0, a1) },
    attach: function (server) { attach(raptor, server) }
  }
}
