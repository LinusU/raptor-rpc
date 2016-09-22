var debug = require('debug')('raptor:server')
var inherits = require('util').inherits
var EventEmitter = require('events').EventEmitter
var hasOwnProperty = require('has-own-property')

var glue = require('./glue')
var Connection = require('./connection')

function Raptor () {
  EventEmitter.call(this)

  this.methods = {}
  this.middleware = []

  var g = glue(this)
  this.serve = g.serve
  this.handle = g.handle
  this.attach = g.attach
}

inherits(Raptor, EventEmitter)

Raptor.prototype.use = function (fn) {
  this.middleware.push(fn)
}

Raptor.prototype.method = function (name, fn) {
  this.methods[name] = fn
}

Raptor.prototype.connection = function (source) {
  var c = new Connection(this, source)
  c.on('error', this.emit.bind(this, 'error'))
  return c
}

Raptor.prototype.hasMethod = function (name) {
  return hasOwnProperty(this.methods, name)
}

Raptor.prototype.run = function (req) {
  debug('Running request with method "' + req.method + '"')

  var handler = this.methods[req.method]
  var stack = this.middleware.concat([handler])

  function next () {
    var fn = stack.shift()

    return Promise.resolve().then(function () {
      return (stack.length ? fn(req, next) : fn(req))
    })
  }

  return next()
}

module.exports = Raptor
