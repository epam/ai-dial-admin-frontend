import type { components, DIAL_SDK, SDKRequestInit } from '@epam/ai-dial-typescript-sdk';

/**
 * Per-call init the `CoreApi` SDK adapters hand to an SDK operation. Bodies are always read as text so
 * the adapter, not `openapi-fetch`, decides how to parse them (see `parseSdkBody`).
 */
export type CoreSdkCallInit = Omit<SDKRequestInit, 'body' | 'params'> & {
  headers: Record<string, string>;
  parseAs: 'text';
};

/** The `{ data, error, response }` triple every SDK operation resolves to, loosened for the adapters. */
export interface CoreSdkResult {
  data?: unknown;
  error?: unknown;
  response: Response;
}

export type CoreSdkCall = (init: CoreSdkCallInit) => Promise<CoreSdkResult>;

/** Query of a metadata read, in the order the hand-written client wrote it: `recursive` first and always present. */
export interface AssetMetadataQuery {
  recursive: boolean;
  token?: string;
  limit?: number;
}

/** Bodies of the two schema save operations, which require a `$id`; taken from the SDK so a change to either surfaces in typecheck. */
export type SdkApplicationTypeSchema = components['schemas']['ApplicationTypeSchema'];
export type SdkCatalogSchema = components['schemas']['CatalogSchema'];

/**
 * One resource type's SDK operations, one typed closure per `AssetApi` verb. Each closure fixes its bucket and
 * calls that type's operation, so `AssetApi` never sees a bucket. `path` is already encoded with `encodeCorePath`:
 * the SDK leaves `%`, `+`, `?` and `#` raw, so a raw name would change the URL.
 */
export interface AssetSdkOps {
  getContent: (sdk: DIAL_SDK, path: string, init: CoreSdkCallInit) => Promise<CoreSdkResult>;
  getMetadata: (
    sdk: DIAL_SDK,
    path: string,
    query: AssetMetadataQuery,
    init: CoreSdkCallInit,
  ) => Promise<CoreSdkResult>;
  save: (sdk: DIAL_SDK, path: string, body: object, init: CoreSdkCallInit) => Promise<CoreSdkResult>;
  delete: (sdk: DIAL_SDK, path: string, init: CoreSdkCallInit) => Promise<CoreSdkResult>;
}
