#!/usr/bin/env node

const fs = require('fs')
const { join } = require('path')

;(async () => {
  console.log(
    yellow(
      '🧪  This feature is experimental, let us know what you think ' +
        '=> https://github.com/thgh/vercel-sapper/pull/47\n'
    )
  )
  // Fallback to current working directory
  const dir = process.argv[2] || '.'

  // TODO: Create a new project if the directory is empty
  // Create a new project if the directory does not exist
  if (!fs.existsSync(dir)) {
    await degit(dir)
  }

  // Configure the project for Vercel
  patch(dir)

  console.log(green('\nDeploy your Sapper project:\n'))
  console.log('    cd', dir)
  console.log('    vercel\n')
})()

function degit(dir) {
  return new Promise((resolve) => {
    console.log(green('degit'), `sveltejs/sapper-template#rollup`)
    require('child_process').execFile(
      'npx',
      ['degit', 'sveltejs/sapper-template#rollup', dir],
      (err, stdout, stderr) => {
        if (err) {
          console.error(red('something went wrong with degit'), err)
          return
        }

        stdout && console.log(stdout.trim())
        stderr && console.log(stderr.trim())
        console.log(green('Created'), `Sapper project in ${dir}`)
        resolve()
      }
    )
  })
}

async function patch(dir) {
  try {
    const serverFile = fs.existsSync(join(dir, 'src/server.js'))
      ? 'src/server.js'
      : fs.existsSync(join(dir, 'src/server.ts'))
      ? 'src/server.ts'
      : ''

    if (!serverFile) {
      throw new Error(
        `Expected src/server.{js|ts} to exist, is this really a Sapper project?`
      )
    }

    const server = fs.readFileSync(join(dir, serverFile), 'utf8')
    fs.writeFileSync(join(dir, serverFile), patchServer(server, serverFile))
    console.log(green('Patched'), serverFile)
  } catch (e) {
    console.error(red(e.message))
  }

  try {
    if (fs.existsSync(join(dir, 'vercel.json'))) {
      throw new Error('vercel.json already exists')
    }
    fs.writeFileSync(
      join(dir, 'vercel.json'),
      `{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "vercel-sapper"
    }
  ]
}`
    )
    console.log(green('Created'), 'vercel.json')
  } catch (e) {
    console.error(red(e.message))
  }

  try {
    if (fs.existsSync(join(dir, '.vercelignore'))) {
      throw new Error('.vercelignore already exists')
    }
    fs.writeFileSync(
      join(dir, '.vercelignore'),
      `/__sapper__
/cypress
!node_modules
/node_modules/*`
    )
    console.log(green('Created'), '.vercelignore')
  } catch (e) {
    console.error(red(e.message))
  }
}

function patchServer(server, serverFile) {
  if (server.includes('export default')) {
    throw new Error(`${serverFile} was already patched`)
  }
  if (server.includes('module.exports')) {
    throw new Error(`${serverFile} was already patched`)
  }
  if (!server.includes('polka()') && !server.includes('express()')) {
    throw new Error(`${serverFile} should contain polka() or express()`)
  }

  // Simplest case
  if (server.includes('\npolka()')) {
    return server.replace('\npolka()', '\nexport default polka()')
  }
  if (server.includes('\nexpress()')) {
    return server.replace('\nexpress()', '\nexport default express()')
  }

  // Server is assigned to variable
  if (server.includes('= polka()')) {
    return server.replace('= polka()', '= (module.exports = polka())')
  }
  if (server.includes('= express()')) {
    return server.replace('= express()', '= (module.exports = express())')
  }

  throw new Error(
    `${serverFile} needs manual patch: https://www.npmjs.com/package/vercel-sapper#manual-configuration`
  )
}

function red(text) {
  return '\u001b[1m\u001b[31m' + text + '\u001b[39m\u001b[22m'
}

function green(text) {
  return '\u001b[1m\u001b[32m' + text + '\u001b[39m\u001b[22m'
}

function yellow(text) {
  return '\u001b[1m\u001b[33m' + text + '\u001b[39m\u001b[22m'
}
