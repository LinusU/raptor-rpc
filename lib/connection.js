
var stream = require('stream');
var Request = require('./request');

function Connection (raptor) {
  stream.Transform.call(this);

  this._chunks = [];
  this._source = null;
  this.raptor = raptor;

  this.on('pipe', this.setSource.bind(this));
}

Connection.prototype = Object.create(stream.Transform.prototype);

Connection.prototype.setSource = function (src) {
  this._source = src;
  return this;
};

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

  var raptor = this.raptor;
  var source = this._source;

  function handleObject (obj, cb) {

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

    if (!raptor.hasMethod(obj.method)) {
      return cb(null, {
        jsonrpc: '2.0',
        id: obj.id,
        error: {
          code: -32601,
          message: 'Method not found'
        }
      });
    }

    var req = new Request(obj, source);
    raptor.run(req, function (err, result) {
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

  }

  function handleArray (arr, cb) {

    if (arr.length === 0) {
      return cb(null, {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32600,
          message: 'Invalid Request'
        }
      });
    }

    var i = arr.length;
    var res = new Array(i);

    arr.forEach(function (obj, idx) {
      handleObject(obj, function (err, val) {
        if (err) { return cb(err); }

        res[idx] = val;
        (--i === 0) && cb(null, res);
      });
    });

  }

  if (Array.isArray(obj)) {
    handleArray(obj, cb);
  } else {
    handleObject(obj, cb);
  }

};

module.exports = Connection;
