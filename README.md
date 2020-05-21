# now-sapper

Vercel (fka ZEIT Now) 2.0 builder for Sapper with SSR enabled

## What's in it for you?

* [x] Deploy your Sapper app as a Lambda in 30 seconds.
* [x] Serve all static assets from a CDN.

## Basic usage

You must make 3 changes to your project to get started:

1. Configure `now-sapper` as builder in `vercel.json`
2. Export the server instance in `src/server.js`
3. Ignore the local build folder `__sapper__`

Check out this [demo project](https://github.com/beyonk-adventures/now-sapper-demo) that uses this builder. It can be used as a template, or a way to verify correct usage of the following instructions.

##### 1. Configure `now-sapper` as builder in `vercel.json`

```json
{
  "version": 2,
  "builds": [{ "src": "package.json", "use": "now-sapper" }]
}
```

##### 2. Export the server instance in `src/server.js`

```js
const app = express() // or polka()
export default app
```

##### 3. Ignore the local build folder `__sapper__`

Example `.vercelignore` :
```
__sapper__
node_modules
```

Consider also ignoring the `cypress` folder if you are not running tests.

#### 4. Running

The `vercel` command will build and deploy your project for you.

Run `sapper dev` for local development. [`vercel dev` does not work for local development](https://github.com/thgh/now-sapper/issues/4#issuecomment-536189926)

## Options

##### Node.js version

You can change the Node.js version with the engines field.

Example `package.json`
```json
{
  "engines": {
    "node": "12.x"
  }
}
```

##### No-build usage

Useful if you are building the project on CI, and then want to just push the compiled source.

Recommended `.vercelignore`:
```
__sapper__/dev
__sapper__/export
cypress
node_modules
```

Example `vercel.json`
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

## Changelog

Please see [CHANGELOG](CHANGELOG.md) for more information on what has changed recently.

## Contributing

Contributions and feedback are very welcome.

This project aims to enable developers to deploy to Vercel with minimal config. New features should be in line with other builders like [now-next](https://github.com/zeit/now/tree/master/packages/now-next).
