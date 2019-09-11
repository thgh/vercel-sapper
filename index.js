const { createLambda } = require('@now/build-utils/lambda.js') // eslint-disable-line import/no-extraneous-dependencies
const os = require('os') 
const path = require('path')
const fs = require('fs-extra')

const {
  download,
  FileBlob,
  FileFsRef,
  runNpmInstall,
  runPackageJsonScript,
  glob
} = require('@now/build-utils')

const bridge = require('@now/node-bridge')

exports.config = {
  maxLambdaSize: '10mb'
}

function getConfig (rawConfig) {
  return {
    build: true,
    runtime: 'nodejs8.10',
    ...rawConfig
  }
}

async function npmBuild (config, entrypointDir, meta) {
  if (config.build) {
    await runNpmInstall(entrypointDir, ['--prefer-offline'], {}, meta)
    await runPackageJsonScript(
      entrypointDir,
      'build',
      {}
    )

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'now-'))

    await fs.copy(
      path.join(entrypointDir, 'package.json'),
      path.join(tempDir, 'package.json')
    )
    
    const originalDir = process.cwd()
    process.chdir(tempDir)
    await runNpmInstall(tempDir, ['--prefer-offline', '--production'], {}, meta)
    process.chdir(originalDir)

    return globAndPrefix(tempDir, 'node_modules')
  }
}

function getLauncherFiles (mountpoint) {
  const launcherPath = path.join(__dirname, 'lib', 'launcher.js')
  const compiled = fs.readFileSync(launcherPath, { encoding: 'utf-8' }).replace(new RegExp('{mountpoint}', 'g'), mountpoint)
  return {
    'launcher.js': new FileBlob({ data: compiled }),
    'bridge.js': new FileFsRef({ fsPath: bridge })
  }
}

function getMountPoint (entrypoint) {
  const entrypointName = path.basename(entrypoint)
  if (entrypointName !== 'package.json') {
    throw new Error('This builder requires a `package.json` file as its entrypoint.')
  }

  return path.dirname(entrypoint)
}

async function globAndPrefix (entrypointDir, subDir) {
  const paths = await glob('**', path.join(entrypointDir, subDir))
  return Object.keys(paths).reduce((c, n) => {
    c[`${subDir}/${n}`] = paths[n]
    return c
  }, {})
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
    // ...Object.keys(staticFiles).map(file => ({ src: `/${file}`, headers: { 'Cache-Control': 'max-age=31557600' } })),
    { src: '/(.*)', dest: '/' }
  ]
  
  // return { output, routes }
  return output
}
