
var stream = require('stream');
var Request = require('./request');

function Connection (raptor) {
  stream.Transform.call(this);

  this._chunks = [];
  this.raptor = raptor;
}

Connection.prototype = Object.create(stream.Transform.prototype);

Connection.prototype._transform = function (chunk, encoding, cb) {

  if (Buffer.isBuffer(chunk)) {
    this._chunks.push(chunk);
  } else {
    this._chunks.push(new Buffer(chunk, encoding));
  }

  cb(null);
};

Connection.prototype._flush = function (cb) {

  var self = this;
  var buf = Buffer.concat(this._chunks);

  this.handleBuffer(buf, function (err, obj) {
    if (err) {
      cb(err);
    } else {
      self.push(JSON.stringify(obj));
      cb(null);
    }
  });
};

Connection.prototype.handleBuffer = function (buf, cb) {
  var err, obj;

  try {
    obj = JSON.parse(buf.toString());
  } catch (e) {
    err = e;
  }

  if (err) {
    cb(null, {
      jsonrpc: '2.0',
      error: {
        code: -32700,
        message: 'Parse error'
      }
    });
  } else {
    this.handleObject(obj, cb);
  }

};

Connection.prototype.handleObject = function (obj, cb) {

  if (!Request.isValid(obj)) {
    return cb(null, {
      jsonrpc: '2.0',
      id: obj.id,
      error: {
        code: -32600,
        message: 'Invalid Request'
      }
    });
  }

  if (!this.raptor.hasMethod(obj.method)) {
    return cb(null, {
      jsonrpc: '2.0',
      id: obj.id,
      error: {
        code: -32601,
        message: 'Method not found'
      }
    });
  }

  var req = new Request(obj);
  this.raptor.run(req, function (err, result) {
    if (err) {
      cb(null, {
        jsonrpc: '2.0',
        id: obj.id,
        error: {
          code: (err.code || 0),
          message: err.toString()
        }
      });
    } else {
      cb(null, {
        jsonrpc: '2.0',
        id: obj.id,
        result: result
      });
    }
  });

};

module.exports = Connection;
