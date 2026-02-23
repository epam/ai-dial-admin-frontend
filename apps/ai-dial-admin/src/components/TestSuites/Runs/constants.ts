import { FilterDto } from '@/src/models/request';
import { FilterOperatorDto } from '@/src/types/request';

export const RUN_FILTER = (testSuiteId: string): FilterDto => ({
  column: 'testSuiteId',
  operator: FilterOperatorDto.EQUALS,
  value: testSuiteId,
});

export const VALID_FILTERS = [
  { column: 'isValid', operator: FilterOperatorDto.EQUALS, value: 'true' },
  { column: 'isEnabled', operator: FilterOperatorDto.EQUALS, value: 'true' },
];
