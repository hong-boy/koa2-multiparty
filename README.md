# koa2-multiparty

[![Build Status](https://travis-ci.org/hong-boy/koa2-multiparty.svg?branch=master)](https://travis-ci.org/hong-boy/koa2-multiparty)

It's similar to 
[connect-multiparty](https://github.com/expressjs/connect-multiparty), but koa2-multiparty is for __KOA2__ only.

This middleware will create temp files on your server and never clean them
up. Thus you should not add this middleware to all routes; only to the ones
in which you want to accept uploads. And in these endpoints, be sure to
delete all temp files, even the ones that you don't use.

## Usage

```js
const multiparty = require('koa2-multiparty');
router.post('/upload', multiparty(), function(ctx) {
  console.log(ctx.req.body, ctx.req.files);
  // don't forget to delete all req.files when done
});
```

If you pass options to `multiparty()`, they are passed directly into
multiparty.

## License

[MIT](LICENSE)
