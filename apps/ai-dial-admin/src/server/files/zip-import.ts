/**
 * Zip-import validation and content-type inference, ported from the admin backend's
 * `PathUtils.validateZipEntryPath` and `URLConnection.guessContentTypeFromName` usage in
 * `FileService.uploadFileZip`. This is a security control (path-traversal defense), not a
 * behavioral nicety — every check below is required, not a simplification.
 */

export const FILES_ZIP_PREFIX = 'files/';

const WINDOWS_ABSOLUTE_PATH_RE = /^[A-Za-z]:[\\/]/;

/**
 * Rejects `..` segments, absolute paths (POSIX or Windows-style), null bytes, and entries
 * that don't live under the given prefix (matching the backend's own export format, so
 * import only accepts archives shaped the way this app's export produces them). Backslashes
 * are normalized to forward slashes before the prefix/traversal checks, so a
 * backslash-encoded escape (`files\..\..\etc\passwd`) cannot slip past a naive `/`-only check.
 * Shared by every zip-import consumer (Files, Prompts) — the security check itself doesn't
 * vary by resource type, only the required prefix does.
 */
export const isValidZipEntryPathWithPrefix = (entryPath: string, prefix: string): boolean => {
  if (!entryPath) {
    return false;
  }
  if (entryPath.includes('\0')) {
    return false;
  }
  if (entryPath.includes('..')) {
    return false;
  }
  if (entryPath.startsWith('/') || WINDOWS_ABSOLUTE_PATH_RE.test(entryPath)) {
    return false;
  }

  const normalized = entryPath.replace(/\\/g, '/');
  if (normalized.includes('..')) {
    return false;
  }
  if (normalized.startsWith('/') || WINDOWS_ABSOLUTE_PATH_RE.test(normalized)) {
    return false;
  }
  return normalized.startsWith(prefix);
};

/** Files-specific convenience wrapper over {@link isValidZipEntryPathWithPrefix}. */
export const isValidZipEntryPath = (entryPath: string): boolean => {
  return isValidZipEntryPathWithPrefix(entryPath, FILES_ZIP_PREFIX);
};

/** Strips the `files/` prefix, leaving the path relative to the import destination folder. */
export const stripZipFilesPrefix = (entryPath: string): string => {
  return entryPath.replace(/\\/g, '/').slice(FILES_ZIP_PREFIX.length);
};

const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  txt: 'text/plain',
  csv: 'text/csv',
  html: 'text/html',
  htm: 'text/html',
  md: 'text/markdown',
  json: 'application/json',
  xml: 'application/xml',
  pdf: 'application/pdf',
  zip: 'application/zip',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  mp4: 'video/mp4',
};

export const DEFAULT_CONTENT_TYPE = 'application/octet-stream';

/** Infers a content type from a filename's extension, falling back to a generic binary type. */
export const inferContentTypeFromFileName = (fileName: string): string => {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1 || lastDot === fileName.length - 1) {
    return DEFAULT_CONTENT_TYPE;
  }
  const extension = fileName.slice(lastDot + 1).toLowerCase();
  return EXTENSION_CONTENT_TYPES[extension] || DEFAULT_CONTENT_TYPE;
};
