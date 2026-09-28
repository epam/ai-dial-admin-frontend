import { contentTypes } from '@/src/constants/file';

import { Token } from '@/src/models/auth';
import { errorObjLog } from '@/src/server/logger';
import { getAuthorizationHeader } from '@/src/utils/auth/api-headers';
import { sendRequest } from './send-request';

export const streamRequest = async (
  url: string,
  fileName: string,
  token?: Token,
  isPreview?: boolean,
): Promise<Response> => {
  try {
    const res = await sendRequest(url, 'GET', getAuthorizationHeader(token));
    const reader = res?.body as ReadableStream<Uint8Array>;
    const stream = createReadableStream(reader);
    const headers = new Headers();
    const resolvedFileName = getFileNameFromContentDisposition(res?.headers.get('Content-Disposition')) || fileName;
    const contentType = res?.headers.get('Content-Type') || getContentType(resolvedFileName);
    if (contentType) {
      headers.append('Content-Type', contentType);
    }

    headers.append(
      'Content-Disposition',
      isPreview ? 'inline' : `attachment; ${buildFilenameDisposition(resolvedFileName)}`,
    );
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

/**
 * Extracts the filename the backend actually sent, so a response whose content doesn't match the
 * caller-supplied `fileName` (e.g. an export that becomes a ZIP once file-type fields are involved)
 * still downloads with the right name and extension.
 */
export const getFileNameFromContentDisposition = (disposition?: string | null): string | null => {
  if (!disposition) return null;

  const match = disposition.match(/filename[^;=\n]*=(['"]?)([^'";\n]+)\1/);
  return match?.[2]?.trim() || null;
};

export const getContentType = (fileName: string): string | null => {
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (extension && contentTypes[`.${extension}`]) {
    return contentTypes[`.${extension}`];
  }

  return null;
};

/**
 * Builds the `filename=`/`filename*=` pair for a `Content-Disposition` header (RFC 6266/5987).
 * `Headers` values must be Latin1-only (the Fetch API converts them to a `ByteString`) — any
 * character outside that range (e.g. `™`, U+2122) throws at `headers.append(...)` otherwise.
 * The ASCII fallback substitutes such characters; `filename*=UTF-8''<percent-encoded>` carries
 * the exact name for clients that support it.
 */
export const buildFilenameDisposition = (fileName: string): string => {
  const asciiFileName = fileName.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, "'");
  const encodedFileName = encodeURIComponent(fileName);
  return `filename="${asciiFileName}"; filename*=UTF-8''${encodedFileName}`;
};
