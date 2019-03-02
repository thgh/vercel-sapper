# now-sapper

Your Sapper project must be adapted to work with Zeit Now v2, see https://github.com/thgh/sapper-template/commit/220307c800525633063df3e3373bc76d0e62cd86

For Express, the instance must be exported in `src/server.js`
```
const app = express()
export default app
```

For Polka, the handler must be exported in `src/server.js`
```
const app = polka()
export default app.handler
```

Example `now.json`
```
{
  "version": 2,
  "builds": [
    {
      "src": "__sapper__/build/index.js",
      "use": "now-sapper"
    }
  ],
  "routes": [{ "src": "/(.*)", "dest": "__sapper__/build/index.js" }]
}
```

Recommended ignore:
```
# .nowignore
*
!static
!static/
!__sapper__
!__sapper__/
__sapper__/dev
```
