
var Raptor = require('../');
var assert = require('assert');
var events = require('events');

exports.app = function () {

  var app = new Raptor;

  app.method('ping', function (req, cb) {
    cb(null, 'pong');
  });

  app.method('remote', function (req, cb) {
    cb(null, req.remote);
  });

  app.method('require-name', function (req, cb) {
    req.require('name', 'string');
    cb(null, req.param('name'));
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

  var remote = null;
  ee.on('remote', function (r) {
    remote = r;
  });

  ee.run = function (cb) {
    var i = 7;
    var tick = function () {
      (--i === 0) && cb();
      assert(i >= 0, 'Too many responses');
    };

    sm('ping', 123, function (obj) {
      assert(obj.error);
      assert.equal(obj.error.code, -32600);
      assert.equal(obj.error.message, 'Invalid Request');
      tick();
    });

    sm('djaksl', function (obj) {
      assert(obj.error);
      assert.equal(obj.error.code, -32601);
      assert.equal(obj.error.message, 'Method not found');
      tick();
    });

    sm('ping', function (obj) {
      assert.equal(obj.result, 'pong');
      tick();
    });

    sm('remote', function (obj) {
      assert.equal(obj.result.type, remote.type);
      assert.equal(obj.result.port, remote.port);
      tick();
    });

    sm('require-name', function (obj) {
      assert(obj.error);
      assert.equal(obj.error.code, -32602);
      assert.equal(obj.error.message, 'InvalidParams: Missing required param name');
      tick();
    });

    sm('require-name', { name: 1337 }, function (obj) {
      assert(obj.error);
      assert.equal(obj.error.code, -32602);
      assert.equal(obj.error.message, 'InvalidParams: Param name should be of type string');
      tick();
    });

    sm('require-name', { name: 'linus' }, function (obj) {
      assert.equal(obj.result, 'linus');
      tick();
    });

  };

  return ee;
};
