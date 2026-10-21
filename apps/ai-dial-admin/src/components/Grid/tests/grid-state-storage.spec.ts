import { ColumnState } from 'ag-grid-community';
import { beforeEach, describe, expect, test } from 'vitest';

import { GRID_COLUMNS_KEY } from '@/src/components/Grid/constants';
import { getColumnsStateFromStorage, saveColumnsStateToStorage } from '@/src/components/Grid/utils';

const STORAGE_KEY = 'runs-v2';
const DEFAULT_SORTS: ColumnState[] = [{ colId: 'startedAt', sort: 'desc' }];

describe('getColumnsStateFromStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('defaults the filter model to an empty map, the shape setFilterModel reads', () => {
    const model = getColumnsStateFromStorage(STORAGE_KEY, DEFAULT_SORTS);

    expect(model.columns).toEqual(DEFAULT_SORTS);
    expect(Array.isArray(model.filters)).toBe(false);
    expect(model.filters).toEqual({});
  });

  test('returns the stored filter model as it was written', () => {
    const filters = { status: { filterType: 'text', type: 'equals', filter: 'COMPLETED' } };
    saveColumnsStateToStorage(STORAGE_KEY, { columns: DEFAULT_SORTS, filters });

    expect(getColumnsStateFromStorage(STORAGE_KEY, []).filters).toEqual(filters);
  });

  test('falls back to the defaults when the stored entry holds nothing', () => {
    localStorage.setItem(`${GRID_COLUMNS_KEY}${STORAGE_KEY}`, '{}');

    expect(getColumnsStateFromStorage(STORAGE_KEY, DEFAULT_SORTS)).toEqual({
      columns: DEFAULT_SORTS,
      filters: {},
    });
  });
});
