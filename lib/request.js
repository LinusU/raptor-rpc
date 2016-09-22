var validator = require('is-my-json-valid')
var hasOwnProperty = require('has-own-property')
var InvalidParams = require('./error').InvalidParams

var schema = {
  $schema: 'http://json-schema.org/draft-04/schema#',
  oneOf: [
    { $ref: '#/definitions/request' },
    { type: 'array', minItems: 1, items: { $ref: '#/definitions/request' } }
  ],
  definitions: {
    request: {
      type: 'object',
      required: [ 'jsonrpc', 'method' ],
      properties: {
        jsonrpc: { enum: [ '2.0' ] },
        method: { type: 'string' },
        id: { type: [ 'string', 'number', 'null' ] },
        params: { type: [ 'array', 'object' ] }
      }
    }
  }
}

var fieldType = {
  array: function (x) { return Array.isArray(x) },
  boolean: function (x) { return typeof x === 'boolean' },
  integer: function (x) { return Number.isInteger(x) },
  number: function (x) { return Number.isFinite(x) },
  null: function (x) { return x === null },
  object: function (x) { return x != null && typeof x === 'object' && !Array.isArray(x) },
  string: function (x) { return typeof x === 'string' }
}

function Request (raw, source) {
  this.params = raw.params
  this.source = source

  Object.defineProperty(this, 'id', {
    enumerable: true,
    value: raw.id
  })

  Object.defineProperty(this, 'method', {
    enumerable: true,
    value: raw.method
  })

  Object.defineProperty(this, 'remote', {
    enumerable: true,
    value: (function () {
      // net.Socket
      if (source && source.remoteAddress && source.remotePort) {
        return { type: 'net', address: source.remoteAddress, port: source.remotePort }
      }

      // dgram
      if (source && source.msg && source.rinfo) {
        return { type: 'dgram', address: source.rinfo.address, port: source.rinfo.port }
      }

      // http.IncomingMessage
      if (source && source.connection && source.connection.remoteAddress && source.connection.remotePort) {
        return { type: 'http', address: source.connection.remoteAddress, port: source.connection.remotePort }
      }

      // fail
      return { type: 'unknown', address: undefined, port: undefined }
    }())
  })
}

Request.isValid = validator(schema)

Request.prototype.param = function (key, defValue) {
  return (this.params && hasOwnProperty(this.params, key)) ? this.params[key] : defValue
}

Request.prototype.require = function (key, type) {
  if (type && !hasOwnProperty(fieldType, type)) {
    throw new Error('Unknown type: ' + type)
  }

  if (!(this.params && hasOwnProperty(this.params, key))) {
    throw new InvalidParams('Missing required param "' + key + '"')
  }

  if (type && !fieldType[type](this.params[key])) {
    throw new InvalidParams('Param "' + key + '" should be of type ' + type)
  }

  return this.params[key]
}

module.exports = Request
