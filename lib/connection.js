var stream = require('stream')
var Request = require('./request')

function Connection (raptor) {
  stream.Transform.call(this)

  this._chunks = []
  this._source = null
  this.raptor = raptor

  this.on('pipe', this.setSource.bind(this))
}

Connection.prototype = Object.create(stream.Transform.prototype)

Connection.prototype.setSource = function (src) {
  this._source = src
  return this
}

Connection.prototype._transform = function (chunk, encoding, cb) {
  if (Buffer.isBuffer(chunk)) {
    this._chunks.push(chunk)
  } else {
    this._chunks.push(new Buffer(chunk, encoding))
  }

  cb(null)
}

Connection.prototype._flush = function (cb) {
  var self = this
  var buf = Buffer.concat(this._chunks)

  this.handleBuffer(buf)
    .then(function (obj) {
      self.push(JSON.stringify(obj))
      setImmediate(cb, null)
    })
    .catch(function (err) {
      setImmediate(cb, err)
    })
}

Connection.prototype.handleBuffer = function (buf) {
  var self = this

  return Promise.resolve()
    .then(function () {
      var obj

      try {
        obj = JSON.parse(buf.toString())
      } catch (e) {
        return {
          jsonrpc: '2.0',
          error: {
            code: -32700,
            message: 'Parse error'
          }
        }
      }

      return self.handleObject(obj)
    })
}

Connection.prototype.handleObject = function (obj) {
  var raptor = this.raptor
  var source = this._source

  function handleObject (obj) {
    if (!Request.isValid(obj)) {
      return {
        jsonrpc: '2.0',
        id: obj.id,
        error: {
          code: -32600,
          message: 'Invalid Request'
        }
      }
    }

    if (!raptor.hasMethod(obj.method)) {
      return {
        jsonrpc: '2.0',
        id: obj.id,
        error: {
          code: -32601,
          message: 'Method not found'
        }
      }
    }

    return raptor.run(new Request(obj, source))
      .then(function (result) {
        return {
          jsonrpc: '2.0',
          id: obj.id,
          result: result
        }
      })
      .catch(function (err) {
        return {
          jsonrpc: '2.0',
          id: obj.id,
          error: {
            code: (err.rpcCode || 0),
            message: err.toString(),
            data: err.rpcData
          }
        }
      })
  }

  function handleArray (arr) {
    if (arr.length === 0) {
      return {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32600,
          message: 'Invalid Request'
        }
      }
    }

    return Promise.all(arr.map(function (obj) {
      return handleObject(obj)
    }))
  }

  return Promise.resolve().then(function () {
    return (Array.isArray(obj) ? handleArray(obj) : handleObject(obj))
  })
}

module.exports = Connection
