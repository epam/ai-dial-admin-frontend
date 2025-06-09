import { JWT } from 'next-auth/jwt';

import { logger } from '@/src/server/logger';
import { sendRequest } from './send-request';
import { getAuthorizationHeader } from '@/src/utils/auth/api-headers';

export const streamRequest = async (
  url: string,
  fileName: string,
  token?: JWT | null,
  isPreview?: boolean,
): Promise<Response> => {
  try {
    const res = await sendRequest(url, 'GET', getAuthorizationHeader(token));
    const reader = res?.body as ReadableStream<Uint8Array>;
    const stream = createReadableStream(reader);
    const headers = new Headers();
    headers.append('Content-Disposition', isPreview ? 'inline' : `attachment; filename=${fileName}`);
    return new Response(stream, { headers });
  } catch (e) {
    logger.error('Error', e);
    return new Promise(() => null);
  }
};

export const createReadableStream = (stream: ReadableStream<Uint8Array>): ReadableStream => {
  return new ReadableStream({
    start(controller) {
      const reader = stream.getReader();

      function push() {
        reader
          .read()
          .then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
            return push();
          })
          .catch((err) => {
            controller.error(err);
          });
      }

      push();
    },
  });
};
