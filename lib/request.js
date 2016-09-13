var error = require('./error')

var fieldType = {
  'array': function (x) { return Array.isArray(x) },
  'boolean': function (x) { return typeof x === 'boolean' },
  'integer': function (x) { return typeof x === 'number' && x % 1 === 0 },
  'number': function (x) { return typeof x === 'number' && !isNaN(x) },
  'null': function (x) { return x === null },
  'object': function (x) { return x && typeof x === 'object' && !Array.isArray(x) },
  'string': function (x) { return typeof x === 'string' }
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

Request.isValid = function (obj) {
  if (obj.jsonrpc !== '2.0') {
    return false
  }

  if (typeof obj.method !== 'string') {
    return false
  }

  var pt = typeof obj.params
  if (pt !== 'object' && pt !== 'undefined') {
    return false
  }

  return true
}

Request.prototype.param = function (key, defValue) {
  if (this.params && this.params.hasOwnProperty(key)) {
    return this.params[key]
  } else {
    return defValue
  }
}

Request.prototype.require = function (key, type) {
  if (type && !fieldType.hasOwnProperty(type)) {
    throw new Error('Unknown type: ' + type)
  }

  if (!(this.params && this.params.hasOwnProperty(key))) {
    throw new error.InvalidParams('Missing required param ' + key)
  }

  if (type && !fieldType[type](this.params[key])) {
    throw new error.InvalidParams('Param ' + key + ' should be of type ' + type)
  }

  return this.params[key]
}

module.exports = Request
