# now-sapper

## Usage

### Demo / HowTo

A [demo/how-to project](https://github.com/beyonk-adventures/now-sapper-demo) exists which uses this builder. It can be used as a template, or a way to verify correct usage of the following instructions.

### Basic usage

Pushes the source to now, and builds the project.

Recommended `.nowignore`:
```
__sapper__
cypress
node_modules
```

Example `now.json`
```json
{
  "version": 2,
    "builds": [
    { "src": "package.json", "use": "now-sapper" }
  ],
}
```

### No-build usage

Useful if you are building the project on CI, and then want to just push the compiled source.

Recommended `.nowignore`:
```
__sapper__/dev
__sapper__/export
cypress
node_modules
```

Example `now.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "now-sapper",
      "config": {
        "build": false
      }
    }
  ]
}

```

### Changing the node runtime

You can change the Node.js version with the engines field.

Example `package.json`
```json
{
  "engines": {
    "node": "12.x"
  }
}
```

## Preparation

Your Sapper project must be adapted to work with Zeit Now v2, see https://github.com/thgh/sapper-template/commit/220307c800525633063df3e3373bc76d0e62cd86

For Express, the instance must be exported in `src/server.js`
```js
const app = express()
export default app
```

For Polka, the handler must be exported in `src/server.js`
```js
const app = polka()
export default app.handler
```
