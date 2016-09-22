var util = require('util')

function InvalidRequest () {
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name
  this.rpcCode = -32600
  this.message = 'Invalid Request'
}

function MethodNotFound () {
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name
  this.rpcCode = -32601
  this.message = 'Method not found'
}

function InvalidParams (msg) {
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name
  this.rpcCode = -32602
  this.message = 'Invalid params: ' + msg
}

function ParseError () {
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name
  this.rpcCode = -32700
  this.message = 'Parse error'
}

util.inherits(InvalidRequest, Error)
util.inherits(MethodNotFound, Error)
util.inherits(InvalidParams, Error)
util.inherits(ParseError, Error)

exports.InvalidRequest = InvalidRequest
exports.MethodNotFound = MethodNotFound
exports.InvalidParams = InvalidParams
exports.ParseError = ParseError
