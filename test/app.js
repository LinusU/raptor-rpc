
var helper = require('./_helper');

describe('app', function () {
  it('should handle requests', function (done) {

    var app = helper.app();
    var ee = helper.calls();

    ee.on('request', function (buf) {
      app.handleBuffer(buf, function (err, obj) {
        if (err) {
          ee.emit('error', err);
        } else {
          var b = new Buffer(JSON.stringify(obj));
          ee.emit('response', b);
        }
      });
    });

    ee.run(done);
  });
});
