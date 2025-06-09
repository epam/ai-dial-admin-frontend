export enum ImportFileTypes {
  ARCHIVE = 'archive',
  JSON = 'json',
  FILES = 'files',
}

export enum ConflictResolutionPolicy {
  OVERRIDE = 'override',
  SKIP = 'skip',
  MANUAL = 'manual',
}

export enum ImportStatus {
  SUCCESS = 'success',
  SKIP = 'already_exists',
  ERROR = 'failed',
}
