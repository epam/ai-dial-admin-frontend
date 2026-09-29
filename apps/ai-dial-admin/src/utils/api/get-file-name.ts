export const CONTENT_DISPOSITION_HEADER = 'content-disposition';

/**
 * Get file name from response header
 *
 * @param {Response} response - server response '/'
 * @returns {string} - file name
 */
export const getFileName = (res?: Response) => {
  const content = res?.headers?.get?.(CONTENT_DISPOSITION_HEADER);
  let name = content?.split('filename=')[1];
  if (name?.startsWith('"')) {
    name = name.substring(1, name.length);
  }

  if (name?.endsWith('"')) {
    name = name.substring(0, name.length - 1);
  }
  return name;
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
