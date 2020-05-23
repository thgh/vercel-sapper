'use strict'

const os = require('os')
const path = require('path')
const fs = require('fs-extra')

const { globAndPrefix } = require('./utils')

const { runNpmInstall, runPackageJsonScript } = require('@vercel/build-utils')

exports.npmBuild = async function npmBuild(
  config,
  entrypointDir,
  spawnOpts,
  meta
) {
  if (config.build) {
    await runNpmInstall(entrypointDir, ['--prefer-offline'], spawnOpts, meta)
    await runPackageJsonScript(entrypointDir, 'build', spawnOpts)

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vercel-'))

    await fs.copy(
      path.join(entrypointDir, 'package.json'),
      path.join(tempDir, 'package.json')
    )

    const originalDir = process.cwd()
    process.chdir(tempDir)
    await runNpmInstall(
      tempDir,
      ['--prefer-offline', '--production'],
      spawnOpts,
      meta
    )
    process.chdir(originalDir)

    return globAndPrefix(tempDir, 'node_modules')
  }
}
