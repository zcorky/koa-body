import * as Koa from 'koa';
import onerror from '@zcorky/koa-onerror';
// import * as router from '@zcorky/koa-router';
import * as request from 'supertest';
import 'should';

import bodyParser, { Options } from '../src';

const fixture = require('./fixtures/raw.json');

function App(options?: Options) {
  const app = new Koa();
  app.use(bodyParser(options));
  return app;
}

describe('koa body', () => {
  describe('json body', () => {
    let app: Koa;

    beforeEach(() => {
      app = App();
    });

    it('should parse json body ok', async () => {
      // should work when use body parser again
      app.use(bodyParser());

      app.use(async ctx => {
        ctx.request.body.should.eql({ foo: 'bar' });
        ctx.request.rawBody.should.equal('{"foo":"bar"}');
        ctx.body = ctx.request.body;
      });

      await request(app.listen())
        .post('/')
        .send({ foo: 'bar' })
        .expect(200, { foo: 'bar' });
    });

    it('should parse json body with json-api headers ok', async () => {
      app.use(async ctx => {
        ctx.request.body.should.eql({ foo: 'bar' });
        ctx.request.rawBody.should.equal('{"foo":"bar"}');
        ctx.body = ctx.request.body;
      });

      await request(app.listen())
        .post('/')
        .set('Accept', 'application/vnd.api+json')
        .set('Content-Type', 'application/vnd.api+json')
        .send('{"foo":"bar"}')
        .expect(200, { foo: 'bar' });
    });

    it('should parse json patch', async () => {
      app.use(async ctx => {
        ctx.request.body.should.eql([{op: 'add', path: '/foo', value: 'bar' }]);
        ctx.request.rawBody.should.equal('[{"op": "add", "path": "/foo", "value": "bar"}]');
        ctx.body = ctx.request.body;
      });

      await request(app.listen())
        .patch('/')
        .set('Content-Type', 'application/json-patch+json')
        .send('[{"op": "add", "path": "/foo", "value": "bar"}]')
        .expect(200, [{ op: 'add', path: '/foo', value: 'bar' }]);
    });

    it('should json body reach the limit size', async () => {
      const _app = App({
        jsonLimit: 100,
      });

      _app.use(async ctx => {
        ctx.body = ctx.request.body;
      });

      await request(_app.callback())
        .post('/')
        .send(fixture)
        .expect(413, 'request entity too large');
    });

    it('should json body error with string in strict mode', async () => {
      const _app = new Koa();
      _app.use(onerror({
        log: () => null,
      }));

      _app.use(bodyParser({ jsonLimit: 100 }));

      _app.use(async ctx => {
        ctx.request.rawBody.should.equal('"invalid"');
        ctx.body = ctx.request.body;
      });

      await request(_app.callback())
        .post('/')
        .set('Content-Type', 'application/json')
        .send('"invalid"')
        .expect(400, { message: 'invalid JSON, only supports object and array' });
    });
  });

  describe('options.detectJSON', () => {
    it('should parse json body on /foo.json request', async () => {
      const _app = App({
        detectJSON: ctx => {
          return /\.json/i.test(ctx.path);
        },
      });

      _app.use(async ctx => {
        ctx.request.body.should.eql({ foo: 'bar' });
        ctx.request.rawBody.should.equal('{"foo":"bar"}');
        ctx.body = ctx.request.body;
      });

      await request(_app.callback())
        .post('/foo.json')
        .send(JSON.stringify({ foo: 'bar' }))
        .expect(200, { foo: 'bar' });
    });

    it('should not parse json body on /foo request', async () => {
      const _app = App({
        detectJSON: ctx => {
          return /\.json/i.test(ctx.path);
        },
      });

      _app.use(async ctx => {
        ctx.request.type.should.equal('application/x-www-form-urlencoded');
        ctx.request.is(['application/x-www-form-urlencoded']).should.equal('application/x-www-form-urlencoded');

        ctx.request.body.should.eql({ '{"foo":"bar"}': '' });
        ctx.request.rawBody.should.equal('{"foo":"bar"}');
        ctx.body = ctx.request.body;
      });

      await request(_app.callback())
        .post('/foo')
        .send(JSON.stringify({ foo: 'bar' }))
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, { '{"foo":"bar"}': '' });
    });
  });

  describe('form body', () => {
    let app: Koa;

    it('should parse form body ok', async () => {
      app = App();
      app.use(async ctx => {
        ctx.get('Content-Type').should.equal('application/x-www-form-urlencoded');
        ctx.request.body.should.eql({ foo: { bar: 'baz' } });
        ctx.request.rawBody.should.equal('foo%5Bbar%5D=baz');
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .type('form')
        .send({ foo: { bar: 'baz' } })
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, { foo: { bar: 'baz' } });
    });

    it('should parse form body reach the limit size', async () => {
      app = App({ formLimit: 10 });

      await request(app.callback())
        .post('/')
        .type('form')
        .send({ foo: { bar: 'bazzzzzzzz' } })
        .expect(413, 'request entity too large');
    });
  });

  describe('text body', () => {
    let app: Koa;

    it('should parse text body ok', async () => {
      app = App({
        enableTypes: ['text', 'json'],
      });
      app.use(async ctx => {
        ctx.get('Content-Type').should.equal('text/plain');
        ctx.request.body.should.equal('body');
        ctx.request.rawBody.should.equal('body');
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .type('text')
        .send('body')
        .expect('Content-Type', 'text/plain; charset=utf-8')
        .expect(200, 'body');
    });

    it('should not parse text body when disable', async () => {
      app = App();

      app.use(async ctx => {
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .type('text')
        .send('body')
        .expect(200, {});
    });
  });

  describe('extend type', () => {
    it('should extend json ok', async () => {
      const app = App({
        jsonTypes: ['application/x-javascript'],
      });

      app.use(async ctx => {
        ctx.get('Content-Type').should.equal('application/x-javascript');
        ctx.request.type.should.equal('application/x-javascript');
        ctx.request.is(['application/x-javascript']).should.equal('application/x-javascript');
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .type('application/x-javascript')
        .send(JSON.stringify({ foo: 'bar' }))
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, { foo: 'bar' });
    });
  });

  describe('options.enableTypes', () => {
    it('should disable json success', async () => {
      const app = App({
        enableTypes: ['form'],
      });

      app.use(async (ctx) => {
        ctx.body = ctx.request.body;
      });

      await request(app.listen())
        .post('/')
        .type('json')
        .send({ foo: 'bar' })
        .expect(200, {});
    });
  });

  describe('other type', () => {
    const app = App();

    it('should get body null', async () => {
      app.use(async ctx => {
        ctx.request.body.should.eql({});
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .get('/')
        .expect(200, {});
    });
  });

  describe('options.onerror', () => {
    const app = App({
      onerror(err, ctx) {
        ctx.throw(422, 'custom parse error');
      },
    });

    it('should get custom error message', async () => {
      await request(app.callback())
        .post('/')
        .send('test')
        .set('Content-Type', 'application/json')
        .expect(422, 'custom parse error');
    });
  });

  describe('ctx.disableBodyParser', () => {
    it('should not parse body when disableBodyParser set to true', async () => {
      const app = new Koa();
      app.use(async (ctx, next) => {
        ctx.disableBodyParser = true;
        await next();
      });
      app.use(bodyParser());
      app.use(async ctx => {
        ctx.request.should.not.have.property('rawBody');
        ctx.body = ctx.request.body ? 'parsed' : 'empty';
      });

      await request(app.callback())
        .post('/')
        .send({ foo: 'bar' })
        .set('Content-Type', 'application/json')
        .expect(200, 'empty');
    });
  });

  describe('ctx.rawBody exist, should not override', () => {
    it('should parse body and should not override rawBody', async () => {
      const app = new Koa();
      app.use(async (ctx, next) => {
        ctx.request.rawBody = 'xxxx';
        await next();
      });
      app.use(bodyParser());
      app.use(async ctx => {
        ctx.request.rawBody.should.equal('xxxx');
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .send({ foo: 'bar' })
        .set('Content-Type', 'application/json')
        .expect(200, { foo: 'bar' });
    });
  });
});
