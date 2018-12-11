# body

[![NPM version](https://img.shields.io/npm/v/@koex/body.svg?style=flat)](https://www.npmjs.com/package/@koex/body)
[![Coverage Status](https://img.shields.io/coveralls/koexjs/body.svg?style=flat)](https://coveralls.io/r/koexjs/body)
[![Dependencies](https://img.shields.io/david/koexjs/body.svg)](https://github.com/koexjs/body)
[![Build Status](https://travis-ci.com/koexjs/body.svg?branch=master)](https://travis-ci.com/koexjs/body)
![license](https://img.shields.io/github/license/koexjs/body.svg)
[![issues](https://img.shields.io/github/issues/koexjs/body.svg)](https://github.com/koexjs/body/issues)

> body parser for koa extend.

### Install

```
$ npm install @koex/body
```

### Usage

```javascript
// See more in test
import onerror from '@koex/onerror';
import bodyParser from '@koex/body';
import * as router from '@koex/router';

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