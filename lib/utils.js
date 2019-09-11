'use strict'

const path = require('path')
const fs = require('fs-extra')

const {
  FileBlob,
  FileFsRef,
  glob
} = require('@now/build-utils')

const bridge = require('@now/node-bridge')

exports.getLauncherFiles = function getLauncherFiles (mountpoint) {
  const launcherPath = path.join(__dirname, 'launcher.js')
  const compiled = fs.readFileSync(launcherPath, { encoding: 'utf-8' }).replace(new RegExp('{mountpoint}', 'g'), mountpoint)
  return {
    'launcher.js': new FileBlob({ data: compiled }),
    'bridge.js': new FileFsRef({ fsPath: bridge })
  }
}

exports.getMountPoint = function getMountPoint (entrypoint) {
  const entrypointName = path.basename(entrypoint)
  if (entrypointName !== 'package.json') {
    throw new Error('This builder requires a `package.json` file as its entrypoint.')
  }

  return path.dirname(entrypoint)
}

exports.globAndPrefix = async function globAndPrefix (entrypointDir, subDir) {
  const paths = await glob('**', path.join(entrypointDir, subDir))
  return Object.keys(paths).reduce((c, n) => {
    c[`${subDir}/${n}`] = paths[n]
    return c
  }, {})
}
