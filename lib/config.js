'use strict'

exports.getConfig = function getConfig (rawConfig) {
  return {
    build: true,
    runtime: 'nodejs8.10',
    ...rawConfig
  }
}
