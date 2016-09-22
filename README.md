# Raptor RPC

Raptor RPC is a transport-agnostic RPC server with middleware support and an
easy to use api. It will allow you to have a server up and running in a matter
of minutes, without limiting you to a specific transport.

It works out of the box with the standard transports provided by Node.js and
also with some popular frameworks.

## Installation

```sh
npm install --save raptor-rpc
```

## Usage

```js
// Raptor library
const Raptor = require('raptor-rpc')

// Example libraries
const fetch = require('node-fetch')
const readJsonFile = require('read-json-file')

const app = new Raptor()

app.use(function (req, next) {
  console.log('Incoming request!')
  return next()
})

app.method('ping', function (req) {
  return 'pong'
})

app.method('get-package-name', function (req) {
  return readJsonFile('package.json')
    .then(pkg => pkg.name)
})

app.method('random-name', function (req) {
  return fetch('http://uinames.com/api/')
    .then(res => res.json())
    .then(body => `${body.name} ${body.surname}`)
})

app.serve('http', 1337, function () {
  console.log('Listening on http://localhost:1337/')
})
```

## API

### Raptor

#### `.use(fn)`

Add middleware to the server.

 - `fn`: Middleware function with the signature `(req, next) => Promise`

The middleware function should return a promise of a response. Calling `next`
will return a promise of the next middleware or, if no other middleware exists,
the method handler.

#### `.method(name, fn)`

Register a method with the server.

 - `name`: The method name
 - `fn`: Method handler with the signature `(req) => Promise`

The method handler should return a promise of what to respond with. It's also
acceptable to return the value right away, since the handler is wrapped in a
`.then` call. This also means that any errors thrown will be caught correctly.

#### `.handle(...)`

Handle a request, accepts a number of different parameters.

Read more under `Transports`.

#### `.attach(server)`

Attaches Raptor to the server, accepts a number of different parameters.

Read more under `Transports`.

#### `.serve(type, port[, cb])`

Starts a server and accepts connections.

 - `type`: Which transport to use (`dgram`, `http`, `net`)
 - `port`: Which port to listen to
 - `cb`: Function to be called when accepting connections

Returns the server instance (`dgram.Socket`, `http.Server` or `net.Server`).

### Request

#### `.id`

The jsonrpc id of the request, can be `undefined`. This variable is read-only.

#### `.method`

The method name of the request. This variable is read-only.

#### `.params`

The params object as passed from the client. Can be `Array` or `Object`.

#### `.param(key, defValue)`

Helper function to get a parameter or a default value if it wasn't provided.

 - `key`: Key to fetch, can be `Number` or `String`
 - `defValue`: Value to return if `key` wasn't provided, is `undefined` if not specified.

#### `.require(key, type)`

Helper function to require the presence a parameter and optionally check it's
type. Will send an `Invalid params` error (-32602) back to the client, and stop
execution, if the parameter is not present. It also returns the value of the
parameter.

 - `key`: Key to require, can be `Number` or `String`
 - `type`: If specified, also require the parameter to be of this type

Valid values for `type` is specified in the
[JSON Schema: core definitions and terminology](http://json-schema.org/latest/json-schema-core.html#anchor8)
and [RFC 4627](http://tools.ietf.org/html/rfc4627).

> This is implemented by throwing an Error if the key isn't present, or is of
> the wrong type.

#### `.source`

The source of the connection, i.e. the stream that was piped to the connection.

#### `.remote`

Info about the other end of the connection. Includes three keys:

 - `type`: Type of the transport (`unknown`, `dgram`, `http`, `net`)
 - `address`: Ip address of the remote
 - `port`: The remote port

## Error handling

If you reject within a middleware or a method handler, that error will be sent
back to the client. The description will be `err.toString()` and the code
`err.rpcCode`. If `rpcCode` is undefined the code sent will be `0`.

You can also include additional data by providing `err.rpcData`. `rpcData` can
be of any type.

## Transports

### Express

```js
const app = express()
const raptor = new Raptor()

app.post('/api', raptor.handle)
app.listen(1337)
```

### Dgram

```js
const raptor = new Raptor()
const socket = dgram.createSocket('udp4')

raptor.attach(socket);
socket.bind(1337);
```

### Net

```js
const raptor = new Raptor()
const server = net.createServer({ allowHalfOpen: true })

raptor.attach(server);
server.listen(1337);
```

### Http

```js
const raptor = new Raptor()
const server = http.createServer()

raptor.attach(server);
server.listen(1337);
```

## License

Copyright &copy; 2014 Linus Unnebäck <br>
Licensed under the MIT License (MIT)
