export enum InputBindingType {
  Constant = 'Constant',
  Attribute = 'Attribute',
}

export enum MetricBindingType {
  Constant = 'Constant',
  TestCase = 'TestCase',
  Response = 'Response',
}

export enum TestCaseImportMode {
  OVERRIDE = 'OVERRIDE',
  APPEND = 'APPEND',
  MERGE = 'MERGE',
}

export enum TestCaseConflictStrategy {
  FAIL = 'FAIL',
  SKIP = 'SKIP',
  OVERRIDE = 'OVERRIDE',
}

export enum TestCaseItemType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  INTEGER = 'INTEGER',
  BOOLEAN = 'BOOLEAN',
  OBJECT = 'OBJECT',
  ARRAY = 'ARRAY',
  FILE = 'FILE',
}

export enum ViewerContentType {
  Json = 'json',
  Text = 'text',
}

export enum DatasetVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export enum RevalidationStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  TIMED_OUT = 'TIMED_OUT',
}
