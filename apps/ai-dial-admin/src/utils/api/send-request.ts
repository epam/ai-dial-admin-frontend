import { logError } from '@/src/server/logger';
import { getTraceId } from '@/src/telemetry/get-trace-id';

export const CACHE: RequestInit = { cache: 'no-store' };

export const sendRequest = async <T extends object>(
  url: string,
  type: string,
  headers?: HeadersInit,
  dto?: T,
): Promise<Response> => {
  try {
    return fetch(url, {
      body: JSON.stringify(dto),
      method: type,
      ...CACHE,
      headers: {
        ...(headers || {}),
        traceparent: getTraceId(),
      },
    });
  } catch (e) {
    logError(e, 'Send request failed');
    return new Promise(() => null);
  }
};
