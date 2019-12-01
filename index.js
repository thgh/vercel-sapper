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

  const launcherFiles = getLauncherFiles()
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
    ...serve(staticFiles, 'static/', ''),
    ...serve(applicationFiles, '__sapper__/build/service-worker.js', 'service-worker.js'),
    ...serve(applicationFiles, '__sapper__/build/client', 'client'),
    index: lambda
  }

  const routes = [
    {
      src: '/client/.+\\.(css|js|map)',
      headers: { 'cache-control': 'public,max-age=31536000,immutable' },
      continue: true
    },
    {
      src: '/service-worker.js',
      headers: { 'cache-control': 'public,max-age=0,must-revalidate' },
      continue: true
    },
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/' }
  ]

  return { output, routes }
}

function serve(arr, filePath, routePath) {
  return Object.keys(arr)
    .filter(path => path.startsWith(filePath))
    .reduce((obj, key) => {
      obj[key.replace(filePath, routePath)] = arr[key]
      return obj
    }, {})
}
