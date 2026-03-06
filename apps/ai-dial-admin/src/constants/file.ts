export const ROOT_FOLDER = 'public';
export const FILE_DOWNLOAD = 'api/files/download';
export const FILE_PREVIEW = 'api/files/preview';
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

export const MAX_FILE_SIZE_MB = 4;
