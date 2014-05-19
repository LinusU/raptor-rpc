
function Request (raw, source) {

  this.params = raw.params;
  this.source = source;

  Object.defineProperty(this, 'id', {
    enumerable: true,
    value: raw.id
  });

  Object.defineProperty(this, 'method', {
    enumerable: true,
    value: raw.method
  });

  Object.defineProperty(this, 'remote', {
    enumerable: true,
    value: (function () {

      // net.Socket
      if (source && source.remoteAddress && source.remotePort) {
        return { type: 'net', address: source.remoteAddress, port: source.remotePort };
      }

      // dgram
      if (source && source.msg && source.rinfo) {
        return { type: 'dgram', address: source.rinfo.address, port: source.rinfo.port };
      }

      // http.IncomingMessage
      if (source && source.connection && source.connection.remoteAddress && source.connection.remotePort) {
        return { type: 'http', address: source.connection.remoteAddress, port: source.connection.remotePort };
      }

      // fail
      return { type: 'unknown', address: undefined, port: undefined };

    }())
  });

}

Request.isValid = function (obj) {

  if (obj.jsonrpc !== '2.0') {
    return false;
  }

  if (typeof obj.method !== 'string') {
    return false;
  }

  var pt = typeof obj.params;
  if (pt !== 'object' && pt !== 'undefined') {
    return false;
  }

  return true;
};

Request.prototype.param = function (key, defValue) {
  if (this.params && this.params.hasOwnProperty(key)) {
    return this.params[key];
  } else {
    return defValue;
  }
};

module.exports = Request;
