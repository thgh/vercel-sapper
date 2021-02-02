'use strict'

const os = require('os')
const path = require('path')
const fs = require('fs-extra')

const { globAndPrefix } = require('./utils')

const { runPackageJsonScript, spawnAsync } = require('@vercel/build-utils')

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

    await fs.copy(
      path.join(entrypointDir, 'package-lock.json'),
      path.join(tempDir, 'package-lock.json')
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

async function runNpmInstall(
  destPath,
  args = [],
  spawnOpts
) {
  const opts = { cwd: destPath, ...spawnOpts };
  const env = opts.env ? { ...opts.env } : { ...process.env };
  delete env.NODE_ENV;
  opts.env = env;

  opts.prettyCommand = 'npm ci';
  const commandArgs = args
    .filter(a => a !== '--prefer-offline')
    .concat(['ci', '--no-audit', '--unsafe-perm']);

  if (process.env.NPM_ONLY_PRODUCTION) {
    commandArgs.push('--production');
  }
  console.log('npm', commandArgs.join(' '));
  await spawnAsync('npm', commandArgs, opts);
}