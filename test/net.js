
var net = require('net');
var helper = require('./_helper');

describe('net', function () {
  it('should handle requests', function (done) {

    var app = helper.app();
    var ee = helper.calls();

    var server = net.createServer({ allowHalfOpen: true });
    app.attach(server);

    server.listen(30102, function () {

      ee.on('request', function (b) {

        var client = new net.Socket({ allowHalfOpen: true });

        client.connect(30102, function () {
          client.end(b);
        });

        client.on('data', function (b) {
          ee.emit('response', b);
        });

      });

      ee.run(function () {
        server.close();
        done();
      });

    });

  });
});
