'use strict'

const replace = require('replace')
const degit = require('degit')
const { writeFileSync, writeFile } = require('fs')
const { join } = require('path')

async function clone() {
  const emitter = degit('sveltejs/sapper-template#rollup', {
    force: true
  })

  emitter.on('info', (info) => {
    console.log(info.message)
  })

  return emitter.clone('.')
}

async function patch() {
  replace({
    regex: /polka\(\)/,
    replacement: 'export default polka()',
    paths: [join(__dirname, 'src', 'server.js')]
  })

  writeFileSync(
    join(__dirname, 'vercel.json'),
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

  writeFileSync(
    join(__dirname, '.vercelignore'),
    `__sapper__
cypress
node_modules`
  )
}

function info() {
  console.log('Example installed. Deploy with `vercel`')
}

clone().then(patch).then(info)
