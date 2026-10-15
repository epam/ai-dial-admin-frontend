import { describe, expect, test } from 'vitest';

import { applyAnalyticsIdentifierFilters } from '@/src/utils/audit/analytics-identifier-filters';
import { GridFilter } from '@/src/models/grid-filter';
import { GridFilterType } from '@/src/types/grid-filter';

const UUID = '0190a0b0-1c2d-7e3f-8a4b-5c6d7e8f9a0b';

const filter = (type: GridFilterType, text: string): GridFilter => ({ type, filter: text, filterType: 'text' });

describe('applyAnalyticsIdentifierFilters', () => {
  test.each(['activityId', 'parentActivityId'])('leaves a %s filter that holds a UUID untouched', (column) => {
    const model = { [column]: filter(GridFilterType.EQUALS, UUID.toUpperCase()) };

    expect(applyAnalyticsIdentifierFilters(model)).toEqual({ filterModel: model, isEmpty: false });
  });

  test('trims a UUID that carries stray spaces before it is sent', () => {
    const { filterModel, isEmpty } = applyAnalyticsIdentifierFilters({
      activityId: filter(GridFilterType.EQUALS, `  ${UUID} `),
    });

    expect(filterModel.activityId.filter).toBe(UUID);
    expect(isEmpty).toBe(false);
  });

  test.each(['activityId', 'parentActivityId'])('is empty for an equals on text that is not a UUID in %s', (column) => {
    expect(applyAnalyticsIdentifierFilters({ [column]: filter(GridFilterType.EQUALS, '0190a0b0') }).isEmpty).toBe(true);
  });

  test('treats an import group parent identifier as not matching any row', () => {
    expect(
      applyAnalyticsIdentifierFilters({ parentActivityId: filter(GridFilterType.EQUALS, 'import:i-1') }).isEmpty,
    ).toBe(true);
  });

  test('drops a not-equals on text that is not a UUID, which every row satisfies', () => {
    const { filterModel, isEmpty } = applyAnalyticsIdentifierFilters({
      activityId: filter(GridFilterType.NOT_EQUAL, 'abc'),
      resourceId: filter(GridFilterType.CONTAINS, 'orders'),
    });

    expect(filterModel).toEqual({ resourceId: filter(GridFilterType.CONTAINS, 'orders') });
    expect(isEmpty).toBe(false);
  });

  test('ignores an empty filter and every other column', () => {
    const model = { activityId: filter(GridFilterType.EQUALS, ''), activityType: filter(GridFilterType.EQUALS, 'x') };

    expect(applyAnalyticsIdentifierFilters(model)).toEqual({ filterModel: model, isEmpty: false });
  });
});
