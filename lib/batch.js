var Response = require('./response')
var InvalidRequest = require('./error').InvalidRequest

module.exports = function batch (requests, handleRequest) {
  // If the batch rpc call itself fails to be recognized as an valid JSON or
  // as an Array with at least one value, the response from the Server MUST be
  // a single Response object.

  if (requests.length === 0) {
    return Response.rejected(null, new InvalidRequest())
  }

  // The Server should respond with an Array containing the corresponding
  // Response objects, after all of the batch Request objects have been
  // processed.

  // The Server MAY process a batch rpc call as a set of concurrent tasks,
  // processing them in any order and with any width of parallelism.

  return Promise.all(requests.map(function (request) {
    return handleRequest(request)
  })).then(function (responses) {
    // A Response object SHOULD exist for each Request object, except that
    // there SHOULD NOT be any Response objects for notifications.

    return responses.filter(Boolean)
  }).then(function (responses) {
    // If there are no Response objects contained within the Response array as
    // it is to be sent to the client, the server MUST NOT return an empty
    // Array and should return nothing at all.

    return (responses.length === 0 ? undefined : responses)
  })
}
