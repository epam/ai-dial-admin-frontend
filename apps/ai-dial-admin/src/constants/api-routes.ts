/**
 * Next.js API route paths. Use these instead of hardcoded strings for fetch, window.open, EventSource, etc.
 * For routes with dynamic segments or query params, append them when building the URL.
 */
export enum ApiRoute {
  AuthSignin = '/api/auth/signin',
  Events = '/api/events',
  FilesDownload = '/api/files/download',
  FilesImport = '/api/files/import',
  FilesPreview = '/api/files/preview',
  PromptsImport = '/api/prompts/import',
  RunsStatusStream = '/api/runs/status-stream',
  Sse = '/api/sse',
  TestSuitesExport = '/api/test-suites/export',
  DatasetsExport = '/api/datasets/export',
  Themes = '/api/themes',
}
