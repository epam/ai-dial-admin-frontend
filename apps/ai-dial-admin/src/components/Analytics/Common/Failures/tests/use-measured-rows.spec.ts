import { renderHook } from '@testing-library/react';
import { GridApi } from 'ag-grid-community';
import { describe, expect, test, vi } from 'vitest';

import { useMeasuredRows } from '@/src/components/Analytics/Common/Failures/use-measured-rows';

const fakeApi = (isDestroyed = false) =>
  ({ isDestroyed: () => isDestroyed, onRowHeightChanged: vi.fn() }) as unknown as GridApi;

describe('useMeasuredRows', () => {
  test('re-lays out the rows once the grid api arrives, so heights measured before it apply', () => {
    const api = fakeApi();
    const { rerender } = renderHook(({ gridApi }) => useMeasuredRows(gridApi), {
      initialProps: { gridApi: null as GridApi | null },
    });

    rerender({ gridApi: api });

    expect(api.onRowHeightChanged).toHaveBeenCalledOnce();
  });

  test('leaves a destroyed grid alone', () => {
    const api = fakeApi(true);
    renderHook(() => useMeasuredRows(api));

    expect(api.onRowHeightChanged).not.toHaveBeenCalled();
  });
});
