const {
  createLambda,
  download,
  getNodeVersion,
  getSpawnOptions
} = require('@vercel/build-utils') // eslint-disable-line import/no-extraneous-dependencies
const path = require('path')
const {
  getLauncherFiles,
  getMountPoint,
  globAndPrefix
} = require('./lib/utils')

const { getConfig } = require('./lib/config')
const { npmBuild } = require('./lib/npm')

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
  const nodeVersion = await getNodeVersion(entrypointDir, null, config)
  const spawnOpts = getSpawnOptions(meta, nodeVersion)
  const prodDependencies = await npmBuild(
    config,
    entrypointDir,
    spawnOpts,
    meta
  )

  const launcherFiles = getLauncherFiles()
  const staticFiles = await globAndPrefix(entrypointDir, 'static')
  const applicationFiles = await globAndPrefix(entrypointDir, '__sapper__')
  const includeFilesArray = await Promise.all(
    config.include.map((path) => globAndPrefix(entrypointDir, path))
  )
  const includeFiles = includeFilesArray.reduce(
    (all, files) => ({
      ...all,
      ...files
    }),
    {}
  )

  // To avoid a sirv error, add 1 file from the static folder
  const sirvFix = !Object.keys(includeFiles).find((p) => p.startsWith('static'))
  if (sirvFix) {
    const first = Object.keys(staticFiles)[0]
    if (first) {
      includeFiles[first] = staticFiles[first]
    }
    console.log('vercel-sapper includeFiles', Object.keys(includeFiles))
  }

  // Use the system-installed version of `node` when running via `vercel dev`
  const runtime = meta.isDev ? 'nodejs' : nodeVersion.runtime
  const memory = config.memory || undefined

  const lambda = await createLambda({
    files: {
      ...includeFiles,
      ...launcherFiles,
      ...prodDependencies,
      ...applicationFiles
    },
    handler: 'launcher.launcher',
    runtime,
    ...(memory ? { memory } : {})
  }).catch((e) => {
    console.error('createLambda.error', e)
    console.error('createLambda.config', config)
  })

  const output = {
    ...serve(staticFiles, 'static/', ''),
    ...serve(
      applicationFiles,
      '__sapper__/build/service-worker.js',
      'service-worker.js'
    ),
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
    .filter((path) => path.startsWith(filePath))
    .reduce((obj, key) => {
      obj[key.replace(filePath, routePath)] = arr[key]
      return obj
    }, {})
}
