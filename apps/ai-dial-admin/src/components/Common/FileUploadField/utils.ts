import { matchesAccept } from '@epam/ai-dial-ui-kit';

import { ANY_FILE_TYPE, BYTES_IN_MB } from '@/src/components/Common/FileUploadField/constants';
import { FileUploadError, FileValidationParams } from '@/src/components/Common/FileUploadField/models';

export const getAccept = (acceptTypes?: string): string | undefined =>
  acceptTypes === ANY_FILE_TYPE ? undefined : acceptTypes;

/**
 * Validates a selection against the field's limits and returns the first failing rule, or `undefined`.
 * The order is format, then single-file size, then total count — the one the legacy field reported in.
 */
export const validateFiles = ({
  incoming,
  existingCount,
  acceptTypes,
  maxFilesCount,
  maxFileSize,
}: FileValidationParams): FileUploadError | undefined => {
  const accept = getAccept(acceptTypes);
  if (incoming.some((file) => !matchesAccept(file, accept))) {
    return FileUploadError.Format;
  }
  if (maxFileSize && incoming.some((file) => file.size > maxFileSize * BYTES_IN_MB)) {
    return FileUploadError.Size;
  }
  if (maxFilesCount && existingCount + incoming.length > maxFilesCount) {
    return FileUploadError.Count;
  }
  return undefined;
};

/** The combined size is a standing condition of the list, not a gate on a selection. */
export const isTotalSizeExceeded = (files: File[], maxMultiFilesSize?: number): boolean =>
  !!maxMultiFilesSize && files.reduce((total, file) => total + file.size, 0) > maxMultiFilesSize * BYTES_IN_MB;
