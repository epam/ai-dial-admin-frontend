import { TestCaseItemType } from '@/src/types/evaluation';

export const TYPE_OPTIONS = Object.values(TestCaseItemType).map((type) => ({
  value: type,
  label: type.toLowerCase(),
}));
