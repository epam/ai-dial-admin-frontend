import { describe, expect, test, vi } from 'vitest';
import { ColDef } from 'ag-grid-community';

import { getGroupedAnalyticsColumns } from '../results-grouping-columns';
import StackedTurnsCellRenderer from '@/src/components/Grid/CellRenderers/StackedTurnsCellRenderer';
import TestCaseNameCellRenderer from '@/src/components/Grid/CellRenderers/TestCaseNameCellRenderer';
import { EXPANDER_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { GridRowType, GroupedGridRow } from '@/src/models/evaluation/test-case-grouping';
import { AnalyticsResult } from '@/src/models/evaluation/run';

const results = [
  {
    id: 'r1',
    testCaseName: 'c1',
    responseStatusCode: 200,
    runIndex: 0,
    testCaseData: { q: 'hi' },
    extractedColumns: { answer: 'first' },
  },
] as unknown as AnalyticsResult[];

const flatten = (cols: ColDef[]): ColDef[] =>
  cols.flatMap((col) => {
    const children = (col as ColDef & { children?: ColDef[] }).children;
    return Array.isArray(children) ? flatten(children) : [col];
  });

const build = () => {
  const onToggle = vi.fn();
  const cols = getGroupedAnalyticsColumns(results, onToggle);
  return { cols, leaves: flatten(cols), onToggle };
};

const groupRow = (turns: Record<string, unknown>[]): GroupedGridRow =>
  ({ id: 'g', rowType: GridRowType.GROUP, groupKey: 'g', turns } as unknown as GroupedGridRow);

describe('getGroupedAnalyticsColumns', () => {
  test('prepends a non-sortable expander column bound to onToggleExpand', () => {
    const { cols, onToggle } = build();
    expect(cols[0].colId).toBe(EXPANDER_COLUMN_CEL_ID);
    expect(cols[0].sortable).toBe(false);
    (cols[0].cellRendererParams as { onToggleExpand: (k: string) => void }).onToggleExpand('g');
    expect(onToggle).toHaveBeenCalledWith('g');
  });

  test('name column uses TestCaseNameCellRenderer for GROUP and TURN, default for SINGLE', () => {
    const { leaves } = build();
    const nameCol = leaves.find((c) => c.colId === 'testCaseName');
    const sel = nameCol?.cellRendererSelector;
    expect(sel?.({ data: { rowType: GridRowType.GROUP } } as never)).toEqual({ component: TestCaseNameCellRenderer });
    expect(sel?.({ data: { rowType: GridRowType.TURN } } as never)).toEqual({ component: TestCaseNameCellRenderer });
    expect(sel?.({ data: { rowType: GridRowType.SINGLE } } as never)).toBeUndefined();
  });

  test('data column stacks turns on GROUP rows and passes each turn through the column value logic', () => {
    const { leaves } = build();
    const answerCol = leaves.find((c) => c.field === 'answer');
    const selected = answerCol?.cellRendererSelector?.({
      data: groupRow([{ extractedColumns: { answer: 'first' } }, { extractedColumns: { answer: 'second' } }]),
    } as never);
    expect(selected?.component).toBe(StackedTurnsCellRenderer);
    const getTurnValue = (selected?.params as { getTurnValue: (t: unknown) => unknown }).getTurnValue;
    expect(getTurnValue({ extractedColumns: { answer: 'second' } })).toBe('second');
  });

  test('data column keeps its default renderer (undefined selector) for non-GROUP rows', () => {
    const { leaves } = build();
    const answerCol = leaves.find((c) => c.field === 'answer');
    expect(answerCol?.cellRendererSelector?.({ data: { rowType: GridRowType.SINGLE } } as never)).toBeUndefined();
  });

  test('GROUP representative valueGetter returns the first turn value; single-turn passes through', () => {
    const { leaves } = build();
    const answerCol = leaves.find((c) => c.field === 'answer');
    const group = answerCol?.valueGetter?.({
      data: groupRow([{ extractedColumns: { answer: 'first' } }, { extractedColumns: { answer: 'second' } }]),
      colDef: answerCol,
    } as never);
    expect(group).toBe('first');

    const single = answerCol?.valueGetter?.({
      data: { rowType: GridRowType.SINGLE, extractedColumns: { answer: 'solo' } },
      colDef: answerCol,
    } as never);
    expect(single).toBe('solo');
  });

  test('disables sorting on all columns in grouped mode (projection owns row order)', () => {
    const { leaves } = build();
    leaves.forEach((c) => {
      expect(c.sortable).toBe(false);
      expect(c.sort ?? null).toBeNull();
    });
  });
});
