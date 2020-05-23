'use strict'

const { Server } = require('http')
const { Bridge } = require('./bridge.js')
const path = require('path')

let listener

try {
  if (!process.env.PORT) {
    process.env.PORT = 3000
  }

  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production'
  }

  process.chdir(__dirname)

  listener = require(path.join(__dirname, '__sapper__/build/server/server.js'))

  if (listener.default) {
    listener = listener.default
  }

  if (typeof listener !== 'function' && listener.handler) {
    listener = listener.handler
  }

  if (typeof listener !== 'function') {
    listener = (req, res) => {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.write(`This is now-sapper, your Vercel builder. Turns out we couldn\'t find your server instance. Did you write \`module.exports = app\`?

Read the docs or create an issue: https://github.com/thgh/now-sapper`);
      res.end();
    }
  }
} catch (error) {
  console.error('Server is not listening', error)
  process.exit(1)
}

const server = new Server(listener)

const bridge = new Bridge(server)
bridge.listen()

exports.launcher = bridge.launcher
