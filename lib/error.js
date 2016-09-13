var util = require('util')

function RaptorError (msg) {
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name
  this.message = msg
}

util.inherits(RaptorError, Error)

function InvalidParams (msg) {
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name
  this.rpcCode = -32602
  this.message = msg
}

util.inherits(InvalidParams, RaptorError)

exports.RaptorError = RaptorError
exports.InvalidParams = InvalidParams
