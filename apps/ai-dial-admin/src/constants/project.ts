/** Chat-owned manifest at a project's root: frontmatter `name`/`description`, markdown body = instructions. */
export const PROJECT_MANIFEST_FILE = 'PROJECT.md';

/** Folder, relative to the project root, that holds the context files. */
export const PROJECT_CONTEXT_FOLDER = 'context';

/**
 * Largest project archive read to learn the context files' sizes: Core's default per-project total. Core's
 * metadata carries no file sizes, so the archive's central directory is the only place they are found.
 */
export const PROJECT_ARCHIVE_READ_MAX_BYTES = 64 * 1024 * 1024;

/**
 * How long the page waits for the project archive before giving up on the file sizes. They only improve a display,
 * so a slow or stalled archive must never hold the page (or a publication review) up.
 */
export const PROJECT_ARCHIVE_READ_TIMEOUT_MS = 15_000;

/** Bounds the number of context files, matching the chat application's constant. */
export const PROJECT_CONTEXT_MAX_FILES = 100;

/** Defaults of the `PROJECT_CONTEXT_*` env vars, matching the chat application's. */
export const DEFAULT_PROJECT_CONTEXT_ALLOWED_EXTENSIONS = ['csv', 'pdf', 'xlsx'];
export const DEFAULT_PROJECT_CONTEXT_FILE_MAX_BYTES = 1_048_576;
export const DEFAULT_PROJECT_CONTEXT_TOTAL_MAX_BYTES = 10_485_760;
