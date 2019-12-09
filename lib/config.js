'use strict'

exports.getConfig = function getConfig (rawConfig) {
  return {
    build: true,
    ...rawConfig
  }
}
