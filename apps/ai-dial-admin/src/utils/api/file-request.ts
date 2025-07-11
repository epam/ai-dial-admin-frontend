import { logger } from '@/src/server/logger';
import { CACHE } from './send-request';

export const fileRequest = async (
  url: string,
  headers?: HeadersInit,
  dto?: FormData,
  method?: string,
): Promise<Response> => {
  try {
    return fetch(url, {
      body: dto as FormData,
      method: method || 'POST',
      ...CACHE,
      headers,
    });
  } catch (e) {
    logger.error(e, 'Error');
    return new Promise(() => null);
  }
};
