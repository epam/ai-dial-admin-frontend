import { useEffect, useRef } from 'react';

import { ColDef, GridReadyEvent } from 'ag-grid-community';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { ResponseColumn } from '@/src/models/evaluation/test-suite';
import Columns from '../Columns';

const { latestColumnDefs } = vi.hoisted(() => ({
  latestColumnDefs: { current: [] as ColDef[] },
}));

// Fires onGridReady exactly once per mount (like real AG Grid) and records the `columnDefs` it
// was handed, reproducing the "colDefs are pinned at grid-ready time and never re-pushed"
// behavior that let a stale `onChangeResponseColumns` closure keep reaching a cell after a
// method change — see Columns.tsx's onGridReady/columnDefs handling.
vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ onGridReady }: { onGridReady?: (event: GridReadyEvent) => void }) => {
    const apiRef = useRef({
      updateGridOptions: ({ columnDefs }: { columnDefs?: ColDef[] }) => {
        if (columnDefs) {
          latestColumnDefs.current = columnDefs;
        }
      },
      isDestroyed: () => false,
    });

    useEffect(() => {
      onGridReady?.({ api: apiRef.current } as unknown as GridReadyEvent);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div>Grid</div>;
  },
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();

  return {
    ...actual,
    DialNotification: ({ message }: { message: string }) => <div role="alert">{message}</div>,
  };
});

describe('Columns', () => {
  test('shows a previous-request duplicate error banner', () => {
    render(
      <Columns
        responseColumns={[{ name: 'answer', displayName: 'answer', expression: 'a', type: 'string' }]}
        onChangeResponseColumns={vi.fn()}
        responseSchema={{}}
        duplicateColumn={{ name: 'answer', inPreviousRequest: true }}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(TestSuitesI18nKey.DuplicateResponseColumnNameInPreviousRequest);
  });

  test('shows a sibling duplicate error banner', () => {
    render(
      <Columns
        responseColumns={[
          { name: 'answer', displayName: 'answer', expression: 'a', type: 'string' },
          { name: 'answer', displayName: 'answer', expression: 'b', type: 'string' },
        ]}
        onChangeResponseColumns={vi.fn()}
        responseSchema={{}}
        duplicateColumn={{ name: 'answer', inPreviousRequest: false }}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(TestSuitesI18nKey.DuplicateResponseColumnName);
  });

  test('hides the error banner when there is no duplicate', () => {
    render(
      <Columns
        responseColumns={[{ name: 'answer', displayName: 'answer', expression: 'a', type: 'string' }]}
        onChangeResponseColumns={vi.fn()}
        responseSchema={{}}
      />,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('routes a Display Name edit through the current onChangeResponseColumns after the parent passes a new one without remounting the grid', () => {
    const responseColumns: ResponseColumn[] = [
      { name: 'answer', displayName: 'answer', expression: 'a', type: 'string' },
    ];
    const onChangeBeforeMethodSave = vi.fn();
    const onChangeAfterMethodSave = vi.fn();

    const { rerender } = render(
      <Columns
        responseColumns={responseColumns}
        onChangeResponseColumns={onChangeBeforeMethodSave}
        responseSchema={{}}
      />,
    );

    // Simulate saving a new method from the "Edit Request" wizard: the parent re-renders with a
    // new `onChangeResponseColumns` closure, but the grid (and the colDefs captured at
    // onGridReady) stays mounted — a method change doesn't remount it.
    rerender(
      <Columns
        responseColumns={responseColumns}
        onChangeResponseColumns={onChangeAfterMethodSave}
        responseSchema={{}}
      />,
    );

    const displayNameColumn = latestColumnDefs.current.find((colDef) => colDef.colId === 'displayName');
    const onChange = (displayNameColumn?.cellRendererParams as { onChange: (...args: unknown[]) => void }).onChange;

    onChange('New Display Name', responseColumns[0], 'displayName', 0);

    expect(onChangeAfterMethodSave).toHaveBeenCalledOnce();
    expect(onChangeBeforeMethodSave).not.toHaveBeenCalled();
  });
});
