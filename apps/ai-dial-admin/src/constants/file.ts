import { ApiRoute } from '@/src/constants/api-routes';

export const ROOT_FOLDER = 'public';

/**
 * Placeholder permission set for folder nodes synthesized client-side (root nodes, and any
 * intermediate folder Core's listing didn't itself return). Core's file-listing endpoint is called
 * with `permissions=false` (see `files-core-api.ts`) — real per-folder permissions aren't fetched
 * today — so every such node gets this same assumed set instead of a bare array duplicated at each
 * call site. Replace with the real fetched value once Core is asked for it.
 */
export const DEFAULT_ROOT_FOLDER_PERMISSIONS = ['WRITE', 'READ'];
export const TEMP_FOLDER = '.dial_folder';
export const FILE_DOWNLOAD = ApiRoute.FilesDownload;
export const FILE_PREVIEW = ApiRoute.FilesPreview;
export const PREVIEW_EXTENSIONS = [
  // text
  '.html',
  '.htm',
  '.css',
  '.js',
  '.mjs',
  '.json',
  '.xml',
  '.txt',
  '.md',
  '.csv',
  // image
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  '.ico',
  '.bmp',
  '.avif',
  // audio/video
  '.mp3',
  '.wav',
  '.ogg',
  '.mp4',
  '.webm',
  // pdf
  '.pdf',
];

export const contentTypes: Record<string, string> = {
  // image
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
  '.avif': 'image/avif',
  // text
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.csv': 'text/csv',
  // pdf
  '.pdf': 'application/pdf',
  // audio/video
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

export const MAX_FILE_SIZE_MB = 100;
export const MAX_MULTI_FILES_SIZE_MB = 1000;
