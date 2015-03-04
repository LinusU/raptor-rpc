
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

  app.method('require-array', function (req, cb) {
    req.require('names', 'array');
    cb(null, req.param('names'));
  });

  app.method('set-timeout', function (req, cb) {
    req.require('ms', 'integer');
    setTimeout(cb, req.param('ms'), null, 'pong');
  });

  app.method('require-return', function (req, cb) {
    cb(null, req.require('value', 'string'));
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
  var smm = function (arr) {

    var b = new Buffer(JSON.stringify(arr.map(function (e) {
      if (typeof e[1] === 'function') {
        e[2] = e[1]; e[1] = undefined;
      }

      var i = ++id;
      map[i] = e[2];

      return {
        jsonrpc: '2.0',
        id: i,
        method: e[0],
        params: e[1]
      };

    })));

    ee.emit('request', b);
  };

  ee.on('response', function (buf) {
    var obj = JSON.parse(buf.toString());

    if (!Array.isArray(obj)) {
      obj = [obj];
    }

    obj.forEach(function (obj) {
      map[obj.id](obj);
      delete map[obj.id];
    });

  });

  var remote = null;
  ee.on('remote', function (r) {
    remote = r;
  });

  ee.run = function (cb) {
    var tick, tests = [

      ['ping', 123, function (obj) {
        assert(obj.error);
        assert.equal(obj.error.code, -32600);
        assert.equal(obj.error.message, 'Invalid Request');
        tick();
      }],

      ['djaksl', function (obj) {
        assert(obj.error);
        assert.equal(obj.error.code, -32601);
        assert.equal(obj.error.message, 'Method not found');
        tick();
      }],

      ['ping', function (obj) {
        assert.equal(obj.result, 'pong');
        tick();
      }],

      ['set-timeout', { ms: 30 }, function (obj) {
        assert.equal(obj.result, 'pong');
        tick();
      }],

      ['remote', function (obj) {
        assert.equal(obj.result.type, remote.type);
        assert.equal(obj.result.port, remote.port);
        tick();
      }],

      ['require-name', function (obj) {
        assert(obj.error);
        assert.equal(obj.error.code, -32602);
        assert.equal(obj.error.message, 'InvalidParams: Missing required param name');
        tick();
      }],

      ['require-name', { name: 1337 }, function (obj) {
        assert(obj.error);
        assert.equal(obj.error.code, -32602);
        assert.equal(obj.error.message, 'InvalidParams: Param name should be of type string');
        tick();
      }],

      ['require-name', { name: 'linus' }, function (obj) {
        assert.equal(obj.result, 'linus');
        tick();
      }],

      ['require-array', function (obj) {
        assert(obj.error);
        assert.equal(obj.error.code, -32602);
        assert.equal(obj.error.message, 'InvalidParams: Missing required param names');
        tick();
      }],

      ['require-array', { names: { a: 1 } }, function (obj) {
        assert(obj.error);
        assert.equal(obj.error.code, -32602);
        assert.equal(obj.error.message, 'InvalidParams: Param names should be of type array');
        tick();
      }],

      ['require-array', { names: ['linus', 'steve'] }, function (obj) {
        assert(Array.isArray(obj.result));
        assert.equal(obj.result[0], 'linus');
        assert.equal(obj.result[1], 'steve');
        tick();
      }],

      ['require-return', { value: 'ABC' }, function (obj) {
        assert.equal(obj.result, 'ABC');
        tick();
      }]

    ];

    var i = tests.length * 2;

    tick = function () {
      (--i === 0) && cb();
      assert(i >= 0, 'Too many responses');
    };

    tests.forEach(function (e) {
      sm(e[0], e[1], e[2]);
    });

    smm(tests);

  };

  return ee;
};
