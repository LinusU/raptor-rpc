
function Request (raw) {

  this.params = raw.params;

  Object.defineProperty(this, 'id', {
    enumerable: true,
    value: raw.id
  });

  Object.defineProperty(this, 'method', {
    enumerable: true,
    value: raw.method
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
