
var http = require('http');
var helper = require('./_helper');

var PORT = 30103;

describe('http', function () {

  var app = helper.app();
  var ee = helper.calls();
  var server = http.createServer();

  ee.on('request', function (b) {

    var client = http.request({ port: PORT }, function (res) {
      res.on('data', function (b) {
        ee.emit('remote', { type: 'http', port: client.socket.localPort });
        ee.emit('response', b);
      });
    });

    client.setHeader('Content-Length', b.length);
    client.write(b);
    client.end();

  });

  before(function (done) {
    app.attach(server);
    server.listen(PORT, done);
  });

  ee.registerTests();

  after(function (done) {
    server.close(done);
  });

});
