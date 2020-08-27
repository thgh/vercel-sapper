# vercel-sapper (a.k.a. [now-sapper](https://github.com/thgh/now-sapper/tree/now))

Vercel builder for Sapper with SSR enabled

## What's in it for you?

- [x] Deploy your Sapper app as a Lambda in 30 seconds.
- [x] Serve all static assets from a CDN.

## Automatic configuration

Run `npx vercel-sapper` on an existing project.

Or create a new project with `npx vercel-sapper my-project`

_🧪 This feature is experimental, let us know what you think => https://github.com/thgh/vercel-sapper/pull/47_

## Manual configuration

You must make 3 changes to your project to get started:

1. Configure `vercel-sapper` as builder in `vercel.json`
2. Export the server instance in `src/server.js`
3. Ignore the local build folder `__sapper__`

To install a working example of a vercel-sapper template ready for deployment or development, see the `examples` directory.

```
cd examples/sapper-template
node install.js
```

##### 1. Configure `vercel-sapper` as builder in `vercel.json`

```json
{
  "version": 2,
  "builds": [{ "src": "package.json", "use": "vercel-sapper" }]
}
```

##### 2. Export the server instance in `src/server.js`

```js
const app = express() // or polka()
// app.use(...)
// app.listen(...)
export default app
```

##### 3. Ignore the local build folder `__sapper__`

Example `.vercelignore` :

```
__sapper__
node_modules
```

Consider also ignoring the `cypress` folder if you are not running tests.

#### 4. Deploy to Vercel

Run `vercel` to build and deploy your project. You can install the [vercel](https://vercel.com/download) cli by running `npm i -g vercel`

Run `sapper dev` for local development. [`vercel dev` does not work for local development](https://github.com/thgh/vercel-sapper/issues/4#issuecomment-536189926)

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

##### Include files outside the `__sapper__` folder

The static folder is always hosted on the Vercel CDN. Before v0.42 it was also included in the lambda function. Here is how to include it again:

Example `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "vercel-sapper",
      "config": {
        "include": ["static"]
      }
    }
  ]
}
```

##### Memory Configuration

You can change the amount of memory your lambda runs with. This is useful to optimise costs.

Note that reducing memory also reduces the amount of CPU available to the lambda, so try some values before you optimise too much.

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "vercel-sapper",
      "config": {
        "memory": 3008
      }
    }
  ]
}
```

Where `builds[].config.memory` can be any value allowed by AWS Lambda.

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
      "use": "vercel-sapper",
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

This project aims to enable developers to deploy to Vercel with minimal config. New features should be in line with other builders like [now-next](https://github.com/zeit/now/tree/master/packages/now-next). Please see the [now Developer Reference](https://github.com/zeit/now/blob/master/DEVELOPING_A_RUNTIME.md) for more info.
