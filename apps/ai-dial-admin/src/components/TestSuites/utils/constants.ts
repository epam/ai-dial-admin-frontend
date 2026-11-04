import { TestCaseItemType } from '@/src/types/evaluation';

/**
 * Type hints a `${{name|type}}` placeholder may carry, keyed by the lowercase spelling and ordered the
 * way the docs panel lists them. Hints are case-insensitive — look them up lowercased. Anything else —
 * an unknown hint, no hint at all — is treated as a plain string, the same fallback the backend applies.
 */
export const TEMPLATE_VARIABLE_TYPE_BY_HINT: Record<string, TestCaseItemType | undefined> = {
  string: TestCaseItemType.STRING,
  integer: TestCaseItemType.INTEGER,
  number: TestCaseItemType.NUMBER,
  boolean: TestCaseItemType.BOOLEAN,
  object: TestCaseItemType.OBJECT,
  array: TestCaseItemType.ARRAY,
  file: TestCaseItemType.FILE,
  skill: TestCaseItemType.SKILL,
};
