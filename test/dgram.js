
var dgram = require('dgram');
var helper = require('./_helper');

describe('dgram', function () {
  it('should handle requests', function (done) {

    var app = helper.app();
    var ee = helper.calls();

    var client = dgram.createSocket('udp4');
    var server = dgram.createSocket('udp4');

    app.attach(server);

    ee.on('request', function (b) {
      client.send(b, 0, b.length, 30101, 'localhost');
    });

    client.on('message', function (msg, rinfo) {
      ee.emit('response', msg);
    });

    client.bind(30100, function () {
      server.bind(30101, function () {
        ee.run(done);
      });
    });

  });
});
