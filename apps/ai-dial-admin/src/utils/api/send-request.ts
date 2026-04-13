import { errorObjLog } from '@/src/server/logger';
export const CACHE: RequestInit = { cache: 'no-store' };

export const sendRequest = async <T extends object>(
  url: string,
  type: string,
  headers?: HeadersInit,
  dto?: T,
  signal?: AbortSignal,
): Promise<Response> => {
  try {
    return fetch(url, {
      body: JSON.stringify(dto),
      method: type,
      ...CACHE,
      headers,
      signal,
    });
  } catch (e) {
    // Request cancelled during logout, this is expected
    if ((e as Error).name === 'AbortError') {
      throw e; // Re-throw to be handled by caller
    }
    errorObjLog(e, 'Send request failed');
    return new Promise(() => null);
  }
};
