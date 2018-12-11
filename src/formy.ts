import { Context } from 'koa';
import * as forms from 'formidable';

export interface Options {
  encoding?: string;
  uploadDir?: string;
  keepExtensions?: boolean;
  maxFileSize?: number;
  maxFieldsSize?: number;
  maxFields?: number;
  hash?: string | boolean;
  multiples?: boolean;
  type?: string;
  bytesReceived?: number;
  bytesExpected?: number;
  onFileBegin?: (filename: string, file: forms.File) => any;
}

export interface Multipart {
  parsed: forms.Fields,
  files: forms.Files,
}

export function formy(ctx: Context, options: Options = {}): Promise<Multipart> {
  return new Promise((resolve, reject) => {
    const fields = {};
    const files = {};
    const form: forms.IncomingForm = new (forms as any).IncomingForm(options);
    form
      .on('end', () => {
        return resolve({
          parsed: fields,
          files,
        })
      })
      .on('error', (err: Error) => {
        return reject(err);
      })
      .on('field', (field, value) => {
        if (fields[field]) {
          if (Array.isArray(fields[field])) {
            fields[field].push(value);
          } else {
            fields[field] = [fields[field], value];
          }
        } else {
          fields[field] = value;
        }
      })
      .on('file', (field, file) => {
        if (files[field]) {
          if (Array.isArray(files[field])) {
            files[field].push(file);
          } else {
            files[field] = [files[field], file];
          }
        } else {
          files[field] = file;
        }
      });

    if (options.onFileBegin) {
      form.on('fileBegin', options.onFileBegin);
    }

    form.parse(ctx.req);
  });
}
