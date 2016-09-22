var Raptor = require('../')

module.exports = function () {
  var app = new Raptor()

  app.method('ping', function (req) {
    return 'pong'
  })

  app.method('remote', function (req) {
    return req.remote
  })

  app.method('require-name', function (req) {
    req.require('name', 'string')
    return req.param('name')
  })

  app.method('require-array', function (req) {
    req.require('names', 'array')
    return req.param('names')
  })

  app.method('set-timeout', function (req) {
    req.require('ms', 'integer')

    return new Promise(function (resolve) {
      setTimeout(resolve, req.param('ms'), 'pong')
    })
  })

  app.method('require-return', function (req) {
    return req.require('value', 'string')
  })

  app.method('throw', function (req) {
    var err = new Error('Test')
    err.rpcCode = 1337
    err.rpcData = { a: 1 }
    throw err
  })

  app.method('sum', function (req) {
    return req.params.reduce(function (mem, value) {
      return mem + value
    }, 0)
  })

  app.method('subtract', function (req) {
    var minuend = req.param(0) || req.param('minuend')
    var subtrahend = req.param(1) || req.param('subtrahend')

    return (minuend - subtrahend)
  })

  app.method('get_data', function () {
    return ['hello', 5]
  })

  app.method('update', function () {
    return 'ok'
  })

  app.method('notify_sum', function () {
    return 'thanks'
  })

  app.method('notify_hello', function () {
    return 'good bye'
  })

  return app
}
