import type { SDKRequestInit } from '@epam/ai-dial-typescript-sdk';

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
