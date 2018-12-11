import { Context, Middleware } from 'koa';
import { undefined as isUndef } from '@zcorky/is';
import * as parser from 'co-body';

declare module 'koa' {
  export interface Request {
    body: Body;
    rawBody: string;
  }
}

export type SupportType = 'json' | 'form' | 'text';

export interface Body {
  [key: string]: any;
};

export interface Parsed {
  parsed?: Body;
  raw: string;
};

export interface EnableTypes {
  json?: boolean;
  form?: boolean;
  text?: boolean;
}

export interface Options {
  /**
   * custom json request detect function. Default is `null`.
   */
  detectJSON?: (ctx: Context) => boolean;

  /**
   * support custom error handle, if `koa-body` throw an error, you can customize the response like:
   *
   * app.use(bodyParser({
   *  onerror(err, ctx) {
   *    ctx.throw(422, 'body parse error');
   *  },
   * }))
   */
  onerror?: (err: Error, ctx: Context) => void;

  /**
   * parser will only parse when  request type hits enableTypes, default is `['json', 'form']`.
   */
  enableTypes?: SupportType[];

  /**
   * support extend json types.
   * Default is:
   *  application/json
   *  application/json-patch+json
   *  application/vnd.api+json
   *  application/csp-report
   */
  jsonTypes?: string[];

  /**
   * support extend form types.
   * Default is:
   *  application/x-www-form-urlencoded
   */
  formTypes?: string[];

  /**
   * support extend text types.
   * Default is:
   *  text/plain
   */
  textTypes?: string[];

  /**
   * limit of `json` body. Default is `1mb`.
   */
  jsonLimit?: number | string;

  /**
   * limit of `urlencoded` body. If the body ends up being larger than this limit, a `413` error code is returned.
   * Default is `56kb`.
   */
  formLimit?: number | string;

  /**
   * limit of `text` body. Default is `1mb`.
   */
  textLimit?: number | string;

  /**
   * whether return rawBody, then set rawBody to ctx.request, make you can visit ctx.request.rawBody.
   * Default is `true`.
   */
  returnRawBody?: boolean;
}

const DEFAULTS = {
  enableTypes: {
    json: true,
    form: true,
  },
  // Content-Types
  jsonTypes: [
    'application/json',
    'application/json-patch+json',
    'application/vnd.api+json',
    'application/csp-report',
  ],
  formTypes: [
    'application/x-www-form-urlencoded',
  ],
  textTypes: [
    'text/plain',
  ],
  // raw
  returnRawBody: true,
};

/**
 * Add X-Response-Time header field.
 */
export default (options: Options = {}): Middleware => {
  const detectJSON = options.detectJSON;
  const onerror = options.onerror;
  const enableTypes = isUndef(options.enableTypes) ? DEFAULTS.enableTypes : toEnable(options.enableTypes) as EnableTypes;

  const jsonTypes =  extend(DEFAULTS.jsonTypes, options.jsonTypes);
  const formTypes =  extend(DEFAULTS.formTypes, options.formTypes);
  const textTypes =  extend(DEFAULTS.textTypes, options.textTypes);

  const returnRawBody = options.returnRawBody || DEFAULTS.returnRawBody;

  return async function bodyParser(ctx: Context, next: () => Promise<void>) {
    if ((ctx.request as any).body !== undefined) return await next();
    if (ctx.disableBodyParser) return await next();
    try {
      const res = await parseBody(ctx);
      ctx.request.body = 'parsed' in res ? res.parsed! : {};
      if (isUndef(ctx.request.rawBody)) {
        ctx.request.rawBody = res.raw;
      }
    } catch (err) {
      if (onerror) {
        onerror(err, ctx);
      } else {
        throw err;
      }
    }
    await next();
  };

  async function parseBody(ctx: Context): Promise<Parsed> {
    const _options: parser.Options = {
      jsonTypes,
      formTypes,
      textTypes,
      returnRawBody,
    };

    if (enableTypes.json && ((detectJSON && detectJSON(ctx)) || ctx.request.is(jsonTypes))) {
      _options.limit = options.jsonLimit;
      return await parser.json(ctx, _options);
    }

    if (enableTypes.form && ctx.request.is(formTypes)) {
      _options.limit = options.formLimit;
      return await parser.form(ctx, _options);
    }

    if ((enableTypes as any).text && ctx.request.is(textTypes)) {
      _options.limit = options.textLimit;
      return await parser.text(ctx, _options);
    }

    return {} as Parsed;
  }
};

function toEnable<T extends string>(array: T[]) {
  return array.reduce((last, key: string) => (last[key] = !!key, last), {});
}

function extend<T, V>(defaultS: T[], extendS?: V) {
  if (isUndef(extendS)) {
    return defaultS;
  }

  return [...defaultS, ...extendS as any] as T[];
}