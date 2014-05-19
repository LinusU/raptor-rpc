
function RaptorError (msg) {
  this.name = 'RaptorError';
  this.message = msg;
  Error.captureStackTrace(this, arguments.callee);
}

RaptorError.prototype = Object.create(Error.prototype);

function InvalidParams (msg) {
  this.name = 'InvalidParams';
  this.code = -32602;
  this.message = msg;
  Error.captureStackTrace(this, arguments.callee);
}

InvalidParams.prototype = Object.create(RaptorError.prototype);

exports.RaptorError = RaptorError;
exports.InvalidParams = InvalidParams;
