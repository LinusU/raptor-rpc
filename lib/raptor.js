
var events = require('events');

var glue = require('./glue');
var error = require('./error');
var Connection = require('./connection');

function Raptor() {

  events.EventEmitter.call(this);

  this.methods = {};
  this.middleware = [];

  var g = glue(this);
  this.serve = g.serve;
  this.handle = g.handle;
  this.attach = g.attach;

}

Raptor.prototype = Object.create(events.EventEmitter.prototype);

Raptor.prototype.use = function (fn) {
  this.middleware.push(fn);
};

Raptor.prototype.method = function (name, fn) {
  this.methods[name] = fn;
};

Raptor.prototype.connection = function () {
  var c = new Connection(this);
  c.on('error', this.emit.bind(this, 'error'));
  return c;
}

Raptor.prototype.hasMethod = function (name) {
  return this.methods.hasOwnProperty(name);
};

Raptor.prototype.handleBuffer = function (buf, cb) {
  this.connection().handleBuffer(buf, cb);
};

Raptor.prototype.run = function (req, cb) {
  var i = 0, self = this;
  var guard = function (err) {
    if (err instanceof error.RaptorError) {
      cb(err);
    } else {
      throw err;
    }
  };
  var next = function (err) {
    if (err) {
      cb(err);
    } else if (self.middleware[i]) {
      try { self.middleware[i++](req, next); } catch (e) { guard(e); }
    } else {
      try { self.methods[req.method](req, cb); } catch (e) { guard(e); }
    }
  };

  next();
};

module.exports = Raptor;
