export interface D1Meta {
  changes?: number;
  last_row_id?: number;
  duration?: number;
}

export interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  meta: D1Meta;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = Record<string, unknown>>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<unknown>;
}

export interface R2HttpMetadata {
  contentType?: string;
  contentDisposition?: string;
  cacheControl?: string;
}

export interface R2Range {
  offset?: number;
  length?: number;
  suffix?: number;
}

export interface R2Object {
  key: string;
  size: number;
  etag: string;
  httpEtag?: string;
  httpMetadata?: R2HttpMetadata;
}

export interface R2ObjectBody extends R2Object {
  body: ReadableStream<Uint8Array>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface R2Bucket {
  head(key: string): Promise<R2Object | null>;
  get(key: string, options?: { range?: R2Range }): Promise<R2ObjectBody | null>;
  put(
    key: string,
    value: ReadableStream<Uint8Array> | ArrayBuffer | ArrayBufferView | string | Blob,
    options?: { httpMetadata?: R2HttpMetadata; customMetadata?: Record<string, string> }
  ): Promise<R2Object>;
  delete(keys: string | string[]): Promise<void>;
}

export interface CFEnv {
  DB?: D1Database;
  MEDIA_BUCKET?: R2Bucket;
  AUTH_SECRET?: string;
  GEMINI_API_KEY?: string;
}

export interface PagesFunctionContext<Params = Record<string, string | string[]>> {
  request: Request;
  env: CFEnv;
  params: Params;
  waitUntil(promise: Promise<unknown>): void;
  next(): Promise<Response>;
}

export type PagesFunction<Params = Record<string, string | string[]>> = (
  context: PagesFunctionContext<Params>
) => Promise<Response> | Response;
