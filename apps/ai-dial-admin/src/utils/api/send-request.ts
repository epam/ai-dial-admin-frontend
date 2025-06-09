import { logger } from '@/src/server/logger';

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
      headers,
    });
  } catch (e) {
    logger.error(e, 'Error');
    return new Promise(() => null);
  }
};
