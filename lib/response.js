exports.rejected = function (id, err) {
  return {
    jsonrpc: '2.0',
    id: id,
    error: {
      code: Number(err.rpcCode || 0),
      message: String(err.message),
      data: err.rpcData
    }
  }
}

exports.resolved = function (id, result) {
  return {
    jsonrpc: '2.0',
    id: id,
    result: result
  }
}
