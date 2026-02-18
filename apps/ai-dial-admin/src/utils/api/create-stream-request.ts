import { imageTypes } from '@/src/constants/file';
import { Token } from '@/src/models/auth';
import { errorObjLog } from '@/src/server/logger';
import { getAuthorizationHeader } from '@/src/utils/auth/api-headers';
import { sendRequest } from './send-request';

export const streamRequest = async (
  url: string,
  fileName: string,
  token?: Token | undefined,
  isPreview?: boolean,
): Promise<Response> => {
  try {
    const res = await sendRequest(url, 'GET', getAuthorizationHeader(token));
    const reader = res?.body as ReadableStream<Uint8Array>;
    const stream = createReadableStream(reader);
    const headers = new Headers();
    const contentType = getContentType(fileName);
    if (contentType) {
      headers.append('Content-Type', contentType);
    }

    headers.append('Content-Disposition', isPreview ? 'inline' : `attachment; filename=${fileName}`);
    return new Response(stream, { headers });
  } catch (e) {
    errorObjLog(e, 'Stream request failed');
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

export const getContentType = (fileName: string): string | null => {
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (extension && imageTypes[`.${extension}`]) {
    return imageTypes[`.${extension}`];
  }

  return null;
};
