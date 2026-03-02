export enum InputBindingType {
  Constant = 'Constant',
  Attribute = 'Attribute',
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
  BOOLEAN = 'BOOLEAN',
  OBJECT = 'OBJECT',
  ARRAY = 'ARRAY',
}
