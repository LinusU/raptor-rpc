var debug = require('debug')('raptor:server')
var inherits = require('util').inherits
var EventEmitter = require('events').EventEmitter
var getStream = require('get-stream')

var batch = require('./batch')
var error = require('./error')
var Request = require('./request')
var Response = require('./response')

var InvalidRequest = error.InvalidRequest
var MethodNotFound = error.MethodNotFound
var ParseError = error.ParseError

function Connection (raptor, source) {
  EventEmitter.call(this)

  this._source = (source || null)
  this.raptor = raptor
}

inherits(Connection, EventEmitter)

Connection.prototype.handleStream = function (stream) {
  var self = this

  return getStream.buffer(stream)
    .then(function (buffer) {
      return self.handleBuffer(buffer)
    })
}

Connection.prototype.handleBuffer = function (buffer) {
  var self = this

  return Promise.resolve()
    .then(function () {
      return self.handleString(buffer.toString())
    })
}

Connection.prototype.handleString = function (str) {
  var self = this

  return Promise.resolve()
    .then(function () {
      var obj

      try {
        obj = JSON.parse(str)
      } catch (e) {
        return Response.rejected(null, new ParseError())
      }

      return self.handleObject(obj)
    })
}

Connection.prototype.handleObject = function (obj) {
  var raptor = this.raptor
  var source = this._source

  function handleRequest (obj) {
    if (!Request.isValid(obj)) {
      debug('Invalid request received')
      return Response.rejected(obj.id, new InvalidRequest())
    }

    if (!raptor.hasMethod(obj.method)) {
      debug('Method "' + obj.method + '" not found')
      return Response.rejected(obj.id, new MethodNotFound())
    }

    var req = new Request(obj, source)

    if (obj.id === undefined) {
      debug('Received a notification')

      // A Notification is a Request object without an "id" member. A Request
      // object that is a Notification signifies the Client's lack of interest
      // in the corresponding Response object, and as such no Response object
      // needs to be returned to the client. The Server MUST NOT reply to a
      // Notification, including those that are within a batch request.

      // Notifications are not confirmable by definition, since they do not have
      // a Response object to be returned. As such, the Client would not be
      // aware of any errors (like e.g. "Invalid params","Internal error").

      return raptor.run(req).then(
        function () { debug('Handled notification') },
        function () { debug('Error while handling notification') }
      )
    }

    return raptor.run(req).then(
      function (result) {
        debug('Successfully handled request with id "' + obj.id + '"')
        return Response.resolved(obj.id, result)
      },
      function (err) {
        debug('Error while handling request with id "' + obj.id + '"')
        return Response.rejected(obj.id, err)
      }
    )
  }

  return Promise.resolve().then(function () {
    return (Array.isArray(obj) ? batch(obj, handleRequest) : handleRequest(obj))
  })
}

module.exports = Connection
