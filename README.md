
# Raptor RPC

Raptor RPC is a transport-agnostic RPC server with middleware support and an
easy to use api. It will allow you to have a server up and running in a matter
of minutes, without limiting you to a specific transport.

It works out of the box with the standard transports provided by Node.js and
also with some popular frameworks.

## Installation

```sh
npm install raptor-rpc
```

## Usage

```js
var Raptor = require('raptor-rpc');
var raptor = new Raptor;

raptor.method('ping', function (req, cb) {
  cb(null, 'pong');
});

raptor.serve('http', 1337);
```

## API

### Raptor

#### `.use(fn)`

Add middleware to the server.

 - `fn`: Middleware function that takes `req` and `cb`

#### `.method(name, fn)`

Register a method with the server.

 - `name`: The method name
 - `fn`: Method function, takes `req` and `cb`

#### `.handle(...)`

Handle a request, accepts a number of different parameters.

Read more under `Transports`.

#### `.attach(server)`

Attaches Raptor to the server, accepts a number of different parameters.

Read more under `Transports`.

#### `.serve(type, port)`

Starts a server and accepts connections.

 - `type`: Which transport to use (`dgram`, `http`, `net`)
 - `port`: Which port to listen to

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
execution, if the parameter is not present.

 - `key`: Key to require, can be `Number` or `String`
 - `type`: If specified, also require `typeof param` to equal this

> This is implemented with `try` and `catch` so currently it only works inside
> the main function, not in any asynchronous function. This could be fixed with
> `domain` in the future.

#### `.source`

The source of the connection, i.e. the stream that was piped to the connection.

#### `.remote`

Info about the other end of the connection. Includes three keys:

 - `type`: Type of the transport (`unknown`, `dgram`, `http`, `net`)
 - `address`: Ip address of the remote
 - `port`: The remote port

## Transports

### Express

```js
var app = express();
var raptor = new Raptor;

app.use('/api', raptor.handle);
app.listen(1337);
```

### Dgram

```js
var raptor = new Raptor;
var socket = dgram.createSocket('udp4');

raptor.attach(socket);
socket.bind(1337);
```

### Net

```js
var raptor = new Raptor;
var server = net.createServer({ allowHalfOpen: true });

raptor.attach(server);
server.listen(1337);
```

### Http

```js
var raptor = new Raptor;
var server = http.createServer();

raptor.attach(server);
server.listen(1337);
```

## License

```text
Copyright (c) 2014 Linus Unnebäck
Licensed under the MIT License (MIT)
```
