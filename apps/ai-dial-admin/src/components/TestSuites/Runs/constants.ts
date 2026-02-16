import { FilterDto } from '@/src/models/request';
import { FilterOperatorDto } from '@/src/types/request';

export const RUN_FILTER = (testSuiteId: string): FilterDto => ({
  column: 'testSuiteId',
  operator: FilterOperatorDto.EQUALS,
  value: testSuiteId,
});
