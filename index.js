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

exports.build = async ({
  files,
  entrypoint,
  workPath,
  config: rawConfig,
  meta = {}
}) => {
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
    files: {
      ...staticFiles,
      ...launcherFiles,
      ...prodDependencies,
      ...applicationFiles
    },
    handler: 'launcher.launcher',
    runtime: config.runtime
  }).catch(e => {
    console.error('createLambda.error', e)
    console.error('createLambda.config', config)
  })

  const output = {
    index: lambda,
    ...staticFiles
  }

  const routes = Object.keys(staticFiles)
    .map(path => ({
      src: path.replace('static/', '/'),
      dest: path
    }))
    .concat(
      // Object.keys(applicationFiles)
      //   .filter(path => path.includes('__sapper__/build/client'))
      //   .map(path => ({
      //     src: path.replace('__sapper__/build/client/', '/'),
      //     dest: path,
      //     headers: { 'cache-control': 'public,max-age=31536000,immutable' }
      //   })),
      { src: '/(.*)', dest: '/' }
    )
  console.log('routes', routes)

  return { output, routes }
}
