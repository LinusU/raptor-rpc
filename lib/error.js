var util = require('util')

function InvalidParams (msg) {
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name
  this.rpcCode = -32602
  this.message = msg
}

util.inherits(InvalidParams, Error)

exports.InvalidParams = InvalidParams
