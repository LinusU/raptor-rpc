
var http = require('http');
var helper = require('./_helper');

describe('http', function () {
  it('should handle requests', function (done) {

    var app = helper.app();
    var ee = helper.calls();

    var server = http.createServer();
    app.attach(server);

    server.listen(30103, function () {

      ee.on('request', function (b) {

        var client = http.request({ port: 30103 }, function (res) {
          res.on('data', function (b) {
            ee.emit('remote', { type: 'http', port: client.socket.localPort });
            ee.emit('response', b);
          });
        });

        client.setHeader('Content-Length', b.length);
        client.write(b);
        client.end();

      });

      ee.run(function () {
        server.close();
        done();
      });

    });

  });
});
