import { TestCaseItemType } from '@/src/types/evaluation';

export const TYPE_OPTIONS = Object.values(TestCaseItemType).map((type) => ({
  value: type,
  label: type.toLowerCase(),
}));

// A response column is extracted from a response body, so it cannot reference a skill.
export const RESPONSE_COLUMN_TYPE_OPTIONS = TYPE_OPTIONS.filter(({ value }) => value !== TestCaseItemType.SKILL);
