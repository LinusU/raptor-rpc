
var Raptor = require('../');
var assert = require('assert');
var events = require('events');

exports.app = function () {

  var app = new Raptor;

  app.method('ping', function (req, cb) {
    cb(null, 'pong');
  });

  return app;
};

exports.calls = function () {

  var id = 0;
  var map = {};
  var ee = new events.EventEmitter;
  var sm = function (method, params, cb) {
    if (typeof params === 'function') {
      cb = params; params = undefined;
    }

    var i = ++id;
    map[i] = cb;
    var b = new Buffer(JSON.stringify({
      jsonrpc: '2.0',
      id: i,
      method: method,
      params: params
    }));

    ee.emit('request', b);
  };

  ee.on('response', function (buf) {
    var obj = JSON.parse(buf.toString());
    map[obj.id](obj);
    delete map[obj.id];
  });

  ee.run = function (cb) {
    var i = 3;
    var tick = function () {
      (--i === 0) && cb();
      assert(i >= 0, 'Too many responses');
    };

    sm('ping', 123, function (obj) {
      assert.equal(obj.error.code, -32600);
      assert.equal(obj.error.message, 'Invalid Request');
      tick();
    });

    sm('djaksl', function (obj) {
      assert.equal(obj.error.code, -32601);
      assert.equal(obj.error.message, 'Method not found');
      tick();
    });

    sm('ping', function (obj) {
      assert.equal(obj.result, 'pong');
      tick();
    });

  };

  return ee;
};
