'use strict'

const { Server } = require('http')
const { Bridge } = require('./bridge.js')
const path = require('path')

let listener

try {
  process.env.PORT = 0
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production'
  }

  process.chdir('{mountpoint}')

  listener = require(path.join(
    '{mountpoint}',
    '__sapper__/build/server/server.js'
  ))

  if (listener.default) {
    listener = listener.default
  }
} catch (error) {
  console.error('Server is not listening', error)
  process.exit(1)
}

const server = new Server(listener)

const bridge = new Bridge(server)
bridge.listen()

exports.launcher = bridge.launcher