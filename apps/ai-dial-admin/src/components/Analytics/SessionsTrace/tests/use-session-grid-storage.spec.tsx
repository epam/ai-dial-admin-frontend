import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';

import { useSessionGridStorage } from '@/src/components/Analytics/SessionsTrace/List/use-session-grid-storage';
import { GRID_COLUMNS_KEY } from '@/src/components/Grid/constants';
import { SESSIONS_STORAGE_KEY, SESSIONS_STORAGE_TABLE_KEY } from '@/src/constants/analytics/sessions-trace';

const GRID_STATE_KEY = `${GRID_COLUMNS_KEY}${SESSIONS_STORAGE_KEY}`;
const SAVED_STATE = JSON.stringify({ columns: [{ colId: 'client_session_id', hide: false }] });

const saveGridState = (savedFor?: string) => {
  localStorage.setItem(GRID_STATE_KEY, SAVED_STATE);
  if (savedFor) {
    localStorage.setItem(SESSIONS_STORAGE_TABLE_KEY, savedFor);
  }
};

beforeEach(() => {
  localStorage.clear();
});

describe('useSessionGridStorage', () => {
  test('returns the sessions grid storage key', () => {
    const { result } = renderHook(() => useSessionGridStorage('sessions'));

    expect(result.current).toBe(SESSIONS_STORAGE_KEY);
  });

  test('keeps the saved grid state when it was saved for the same table', () => {
    saveGridState('agent_runs');

    renderHook(() => useSessionGridStorage('agent_runs'));

    expect(localStorage.getItem(GRID_STATE_KEY)).toBe(SAVED_STATE);
  });

  test('drops the saved grid state when it was saved for another table', () => {
    saveGridState('sessions');

    renderHook(() => useSessionGridStorage('agent_runs'));

    expect(localStorage.getItem(GRID_STATE_KEY)).toBeNull();
    expect(localStorage.getItem(SESSIONS_STORAGE_TABLE_KEY)).toBe('agent_runs');
  });

  test('reads a state saved before the marker existed as saved for the default table', () => {
    saveGridState();

    renderHook(() => useSessionGridStorage('sessions'));

    expect(localStorage.getItem(GRID_STATE_KEY)).toBe(SAVED_STATE);
    expect(localStorage.getItem(SESSIONS_STORAGE_TABLE_KEY)).toBe('sessions');
  });

  test('drops an unmarked state once a custom table is bound', () => {
    saveGridState();

    renderHook(() => useSessionGridStorage('agent_runs'));

    expect(localStorage.getItem(GRID_STATE_KEY)).toBeNull();
  });

  test('records the table it now saves for when nothing was saved', () => {
    renderHook(() => useSessionGridStorage('agent_runs'));

    expect(localStorage.getItem(SESSIONS_STORAGE_TABLE_KEY)).toBe('agent_runs');
  });

  test('checks the marker once per mount, so a state saved after mounting survives a re-render', () => {
    saveGridState('sessions');
    const { rerender } = renderHook(({ table }) => useSessionGridStorage(table), {
      initialProps: { table: 'agent_runs' },
    });
    localStorage.setItem(GRID_STATE_KEY, SAVED_STATE);

    rerender({ table: 'agent_runs' });

    expect(localStorage.getItem(GRID_STATE_KEY)).toBe(SAVED_STATE);
  });
});
