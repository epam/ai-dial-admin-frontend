import { ApplicationRoute } from '@/src/types/routes';
import { getFromLocalStorage, setToLocalStorage } from '@/src/utils/local-storage';
import { saveColumnVisibilityToStorage, getColumnVisibilityFromStorage } from './grid-columns';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@/src/utils/local-storage', () => ({
  setToLocalStorage: vi.fn(() => void 0),
  getFromLocalStorage: vi.fn(() => JSON.stringify('')),
}));

describe('Grid :: Store columns into local storage', () => {
  test('Should call setLocalStorage on save', () => {
    const cols = [
      { field: 'field', hide: true, description: 'desc' },
      { field: 'field1', hide: false, description: 'desc2' },
    ];
    saveColumnVisibilityToStorage(cols, ApplicationRoute.Models);
    expect(setToLocalStorage).toHaveBeenCalled();
  });

  test('Should call getlocalStorage on save', () => {
    const cols = [
      { field: 'field', hide: true, description: 'desc' },
      { field: 'field1', hide: false, description: 'desc2' },
    ];
    getColumnVisibilityFromStorage(cols, ApplicationRoute.Models);
    expect(getFromLocalStorage).toHaveBeenCalled();
  });
});
