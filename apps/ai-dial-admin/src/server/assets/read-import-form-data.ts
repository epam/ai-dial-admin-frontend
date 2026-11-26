import { MAX_ASSET_IMPORT_REQUEST_SIZE_MB } from '@/src/constants/file';
import { BYTES_PER_MB } from '@/src/server/zip/constants';

export class ImportRequestTooLargeError extends Error {}

export const readImportFormData = async (request: Request): Promise<FormData> => {
  const maxSize = MAX_ASSET_IMPORT_REQUEST_SIZE_MB * BYTES_PER_MB;
  const contentLength = Number(request.headers.get('content-length'));
  if (contentLength > maxSize) {
    throw new ImportRequestTooLargeError();
  }

  let size = 0;
  const stream = request.body?.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        size += chunk.byteLength;
        if (size > maxSize) {
          throw new ImportRequestTooLargeError();
        }
        controller.enqueue(chunk);
      },
    }),
  );
  return new Response(stream, { headers: { 'content-type': request.headers.get('content-type') || '' } }).formData();
};
