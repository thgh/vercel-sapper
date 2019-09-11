const { createLambda } = require('@now/build-utils/lambda.js') // eslint-disable-line import/no-extraneous-dependencies
const path = require('path')
const {
  getLauncherFiles,
  getMountPoint,
  globAndPrefix
} = require('./lib/utils')

const { getConfig } = require('./lib/config')
const { npmBuild } = require('./lib/npm')
const { download } = require('@now/build-utils')

exports.config = {
  maxLambdaSize: '10mb'
}

exports.build = async ({ files, entrypoint, workPath, config: rawConfig, meta = {} }) => {
  const mountpoint = getMountPoint(entrypoint)
  const entrypointDir = path.join(workPath, mountpoint)
  await download(files, workPath, meta)

  process.chdir(entrypointDir)

  const config = getConfig(rawConfig)
  const prodDependencies = await npmBuild(config, entrypointDir)

  const launcherFiles = getLauncherFiles(mountpoint)
  const staticFiles = await globAndPrefix(entrypointDir, 'static')
  const applicationFiles = await globAndPrefix(entrypointDir, '__sapper__')

  const lambda = await createLambda({
    files: { ...staticFiles, ...launcherFiles, ...prodDependencies, ...applicationFiles },
    handler: 'launcher.launcher',
    runtime: config.runtime
  })

  const output = { 
    index: lambda
  }

  const routes = [
    { src: '/(.*)', dest: '/' }
  ]
  
  return { output, routes }
}
