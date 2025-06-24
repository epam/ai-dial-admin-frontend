export enum ImportFileType {
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

export enum ImportSteps {
  FILES = 'files',
  PROPERTIES = 'properties',
  CONFIGURATION = 'configuration',
}

export enum ImportConfigurationAction {
  CREATE = 'Create',
  UPDATE = 'Update',
  SKIP = 'Skip',
}
