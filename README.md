# koa-body

[![NPM version](https://img.shields.io/npm/v/@zcorky/koa-body.svg?style=flat)](https://www.npmjs.com/package/@zcorky/koa-body)
[![Coverage Status](https://img.shields.io/coveralls/zcorky/koa-body.svg?style=flat)](https://coveralls.io/r/zcorky/koa-body)
[![Dependencies](https://david-dm.org/@zcorky/koa-body/status.svg)](https://david-dm.org/@zcorky/koa-body)
[![Build Status](https://travis-ci.com/zcorky/koa-body.svg?branch=master)](https://travis-ci.com/zcorky/koa-body)
![license](https://img.shields.io/github/license/zcorky/koa-body.svg)
[![issues](https://img.shields.io/github/issues/zcorky/koa-body.svg)](https://github.com/zcorky/koa-body/issues)

> body parser for Koa.

### Install

```
$ npm install @zcorky/koa-body
```

### Usage

```javascript
// See more in test
import onerror from '@zcorky/onerror';
import bodyParser from '@zcorky/koa-body';
import * as router from '@zcorky/koa-router';

import * as Koa from 'koa';
const app = new Koa();

app.use(onerror());
app.use(bodyParse());

app.use(router.post('/', ctx => {
  ctx.body = ctx.request.body;
}));

app.listen(8000, '0.0.0.0', () => {
  console.log('koa server start at port: 8000');
});
```

### Related
* [koa-body](https://github.com/dlau/koa-body)
* [koa-bodyparser](https://github.com/koajs/bodyparser)