var assert = require('assert')

module.exports = [
  ['ping', 123, function (obj) {
    assert(obj.error)
    assert.equal(obj.error.code, -32600)
    assert.equal(obj.error.message, 'Invalid Request')
  }],

  ['djaksl', undefined, function (obj) {
    assert(obj.error)
    assert.equal(obj.error.code, -32601)
    assert.equal(obj.error.message, 'Method not found')
  }],

  ['ping', undefined, function (obj) {
    assert.equal(obj.result, 'pong')
  }],

  ['set-timeout', { ms: 5 }, function (obj) {
    assert.equal(obj.result, 'pong')
  }],

  ['require-name', undefined, function (obj) {
    assert(obj.error)
    assert.equal(obj.error.code, -32602)
    assert.equal(obj.error.message, 'Invalid params: Missing required param "name"')
  }],

  ['require-name', { name: 1337 }, function (obj) {
    assert(obj.error)
    assert.equal(obj.error.code, -32602)
    assert.equal(obj.error.message, 'Invalid params: Param "name" should be of type string')
  }],

  ['require-name', { name: 'linus' }, function (obj) {
    assert.equal(obj.result, 'linus')
  }],

  ['require-array', undefined, function (obj) {
    assert(obj.error)
    assert.equal(obj.error.code, -32602)
    assert.equal(obj.error.message, 'Invalid params: Missing required param "names"')
  }],

  ['require-array', { names: { a: 1 } }, function (obj) {
    assert(obj.error)
    assert.equal(obj.error.code, -32602)
    assert.equal(obj.error.message, 'Invalid params: Param "names" should be of type array')
  }],

  ['require-array', { names: ['linus', 'steve'] }, function (obj) {
    assert(Array.isArray(obj.result))
    assert.equal(obj.result[0], 'linus')
    assert.equal(obj.result[1], 'steve')
  }],

  ['require-return', { value: 'ABC' }, function (obj) {
    assert.equal(obj.result, 'ABC')
  }],

  ['throw', {}, function (obj) {
    assert(obj.error)
    assert.equal(obj.error.code, 1337)
    assert.equal(obj.error.message, 'Test')
    assert.deepEqual(obj.error.data, { a: 1 })
  }]
]
