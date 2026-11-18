import { ColDef, ColGroupDef } from 'ag-grid-community';
import { describe, expect, test, vi } from 'vitest';

import EmptyCellRenderer from '@/src/components/Grid/CellRenderers/EmptyCellRenderer';
import ExecutionStatusCellRenderer from '@/src/components/Grid/CellRenderers/ExecutionStatusCellRenderer';
import OverallScoreCellRenderer from '@/src/components/Grid/CellRenderers/OverallScoreCellRenderer';
import ScoreCellRenderer from '@/src/components/Grid/CellRenderers/ScoreCellRenderer';
import { GROUP_TOGGLE_COL_ID, OVERALL_SCORE_COL_ID } from '@/src/components/Runs/constants';
import { ExtractionRowType, TestCaseGroupRow } from '@/src/components/Runs/models';
import { AnalyticsResult, ExtractionResultStatus } from '@/src/models/evaluation/run';
import { getGroupedColumnDefs } from '../grouped-columns';
import GroupToggleCellRenderer from '../GroupToggleCellRenderer';
import { getAnalyticsColumns } from '../utils';

const THRESHOLD = 0.6;

const results: AnalyticsResult[] = [
  {
    id: 'r1',
    testCaseName: 'tc',
    responseStatusCode: 200,
    runIndex: 0,
    turnIndex: 0,
    requestIndex: 0,
    executionStatus: ExtractionResultStatus.SUCCESS,
    execDurationMs: 1200,
    metricValues: { accuracy: { score: 0.5 } },
    testCaseData: { question: 'q' },
    extractedColumns: { answer: 'a' },
  },
  { id: 'r2', testCaseName: 'tc', responseStatusCode: 200, runIndex: 1, turnIndex: 1, requestIndex: 1 },
];

const groupRow: TestCaseGroupRow = {
  rowType: ExtractionRowType.Group,
  groupKey: 'tc',
  testCaseName: 'tc',
  testCaseScore: 0.7,
  isExpanded: true,
};
const resultRow = { ...results[0], rowType: ExtractionRowType.Result, groupKey: 'tc' };

const flattenLeaves = (cols: (ColDef | ColGroupDef)[]): ColDef[] =>
  cols.flatMap((col) => ('children' in col && col.children ? flattenLeaves(col.children) : [col as ColDef]));

const buildStored = () => getAnalyticsColumns(results, { threshold: THRESHOLD }) as unknown as ColDef[];
const onToggleGroup = vi.fn();
const options = { onToggleGroup, consumeFocusRequest: vi.fn() };
const buildGrouped = (stored = buildStored()) => getGroupedColumnDefs(stored, options);

const findLeaf = (cols: ColDef[], predicate: (col: ColDef) => boolean): ColDef => {
  const leaf = flattenLeaves(cols).find(predicate);
  if (!leaf) throw new Error('column not found');
  return leaf;
};
const byColId = (colId: string) => (col: ColDef) => col.colId === colId;
const byField = (field: string) => (col: ColDef) => col.field === field;

type Selector = (params: { data: unknown }) => { component: unknown; params?: unknown };
const select = (col: ColDef, data: unknown) => (col.cellRendererSelector as unknown as Selector)({ data });
const getValue = (col: ColDef, data: unknown) => (col.valueGetter as (params: { data: unknown }) => unknown)({ data });
const format = (col: ColDef, data: unknown) =>
  (col.valueFormatter as (params: { data: unknown; value: unknown }) => unknown)({
    data,
    value: getValue(col, data),
  });

describe('getGroupedColumnDefs', () => {
  test('makes every column unsortable and unfilterable, with no floating filter', () => {
    flattenLeaves(buildGrouped()).forEach((col) => {
      expect(col.sortable).toBe(false);
      expect(col.filter).toBe(false);
      expect(col.floatingFilter).toBe(false);
    });
  });

  test('keeps the column group structure behind the toggle column', () => {
    const stored = buildStored();

    const [, ...grouped] = buildGrouped(stored);

    expect(grouped.map((col) => col.headerName)).toEqual(stored.map((col) => col.headerName));
    expect(flattenLeaves(grouped)).toHaveLength(flattenLeaves(stored).length);
  });

  test('carries over visibility, ids and widths of every stored column', () => {
    const stored = buildStored();
    const pick = (col: ColDef) => [col.colId, col.field, col.hide, col.width, col.minWidth, col.maxWidth, col.flex];

    const [, ...grouped] = buildGrouped(stored);

    expect(flattenLeaves(grouped).map(pick)).toEqual(flattenLeaves(stored).map(pick));
  });

  test('does not touch the stored column definitions', () => {
    const stored = buildStored();
    const before = flattenLeaves(stored).map((col) => [col.sortable, col.filter, col.floatingFilter, col.cellRenderer]);

    buildGrouped(stored);

    expect(
      flattenLeaves(stored).map((col) => [col.sortable, col.filter, col.floatingFilter, col.cellRenderer]),
    ).toEqual(before);
  });

  test('puts a fixed toggle column in front of every other column', () => {
    const [toggle] = buildGrouped();

    expect(toggle.colId).toBe(GROUP_TOGGLE_COL_ID);
    expect(toggle.cellRenderer).toBe(GroupToggleCellRenderer);
    expect(toggle.cellRendererParams).toBe(options);
  });

  test('pins the toggle column left and makes it neither movable nor resizable', () => {
    const [toggle] = buildGrouped();

    expect(toggle.pinned).toBe('left');
    expect(toggle.lockPinned).toBe(true);
    expect(toggle.lockPosition).toBe('left');
    expect(toggle.suppressMovable).toBe(true);
    expect(toggle.resizable).toBe(false);
  });

  test('keeps the toggle column out of the stored definitions, so the columns panel never lists it', () => {
    expect(flattenLeaves(buildStored()).some((col) => col.colId === GROUP_TOGGLE_COL_ID)).toBe(false);
  });

  test('hands the toggle renderer only functions, since the grid deep-copies plain objects in renderer params', () => {
    const [toggle] = buildGrouped();

    expect(Object.values(toggle.cellRendererParams as object).every((param) => typeof param === 'function')).toBe(true);
  });

  test('keeps the test case name a plain cell, bold only on a group row', () => {
    const name = findLeaf(buildGrouped(), byColId('testCaseName'));
    const isBold = (data: unknown) =>
      (name.cellClassRules?.['font-semibold'] as (params: { data: unknown }) => boolean)({ data });

    expect(name.cellRenderer).toBeUndefined();
    expect(isBold(groupRow)).toBe(true);
    expect(isBold(resultRow)).toBe(false);
  });

  test('shows the overall score on the group row with the run threshold', () => {
    const score = findLeaf(buildGrouped(), byColId(OVERALL_SCORE_COL_ID));

    expect(select(score, groupRow)).toEqual({
      component: OverallScoreCellRenderer,
      params: { threshold: THRESHOLD },
    });
    expect(getValue(score, groupRow)).toBe(0.7);
  });

  test('leaves the overall score empty on a result row', () => {
    const score = findLeaf(buildGrouped(), byColId(OVERALL_SCORE_COL_ID));

    expect(select(score, resultRow).component).toBe(EmptyCellRenderer);
  });

  test.each([
    ['status', byColId('status'), ExecutionStatusCellRenderer],
    ['metric', byColId('accuracy_score'), ScoreCellRenderer],
  ])('blanks the %s column on a group row and keeps its renderer on a result row', (_name, predicate, renderer) => {
    const col = findLeaf(buildGrouped(), predicate);

    expect(select(col, groupRow).component).toBe(EmptyCellRenderer);
    expect(select(col, resultRow).component).toBe(renderer);
  });

  test.each([
    ['input binding', 'question', 'q'],
    ['extracted', 'answer', 'a'],
  ])('shows no dash for the %s column on a group row, only on a result without a value', (_name, field, value) => {
    const col = findLeaf(buildGrouped(), byField(field));

    expect(getValue(col, groupRow)).toBeNull();
    expect(getValue(col, resultRow)).toBe(value);
    expect(getValue(col, { ...resultRow, testCaseData: {}, extractedColumns: {} })).toBe('—');
  });

  test('shows no duration on a group row', () => {
    const duration = findLeaf(buildGrouped(), byColId('duration'));

    expect(format(duration, groupRow)).toBe('');
    expect(format(duration, resultRow)).toBe('1.2s');
  });

  test('shows no position on a group row', () => {
    const run = findLeaf(buildGrouped(), byColId('runIndex'));

    expect(getValue(run, groupRow)).toBeNull();
    expect(getValue(run, resultRow)).toBe(1);
  });

  test('passes a renderer parameter function through the selector', () => {
    const paramsFn = vi.fn().mockReturnValue({ threshold: 1 });
    const stored: ColDef[] = [
      { colId: OVERALL_SCORE_COL_ID, cellRenderer: OverallScoreCellRenderer, cellRendererParams: paramsFn },
    ];

    const [, score] = buildGrouped(stored);

    expect(select(score, groupRow).params).toEqual({ threshold: 1 });
  });

  test('works on a column that has neither id nor field', () => {
    const [, col] = buildGrouped([{ headerName: 'x' }]);

    expect(col.headerName).toBe('x');
    expect(col.sortable).toBe(false);
  });
});
