import { render, screen } from '@testing-library/react';
import { describe, expect, vi } from 'vitest';
import { ColDef, ColGroupDef } from 'ag-grid-community';

import { AnalyticsResult } from '@/src/models/evaluation/run';

import { ComparisonSection } from '../models';

import ComparisonPivotView from '../ComparisonPivotView';

let capturedColumnDefs: (ColDef | ColGroupDef)[] | undefined;
let capturedRowData: unknown[] | null | undefined;

vi.mock('@/src/components/Grid/AgGridWrapper', () => ({
  default: ({ columnDefs, rowData }: { columnDefs?: (ColDef | ColGroupDef)[]; rowData?: unknown[] | null }) => {
    capturedColumnDefs = columnDefs;
    capturedRowData = rowData;
    return (
      <div data-testid="ag-grid-wrapper">
        {/* Render row test-case names so text assertions still work */}
        {(rowData ?? []).map((row: any) => (
          <div key={row._id} data-testid={`row-${row._id}`}>
            <span>{row._testCaseName}</span>
          </div>
        ))}
      </div>
    );
  },
}));

const makeDetail = (overrides: Partial<AnalyticsResult> = {}): AnalyticsResult => ({
  id: 'r1',
  responseStatusCode: 200,
  runIndex: 0,
  turnIndex: 0,
  totalTurns: 1,
  executionStatus: 'SUCCESS' as const,
  execDurationMs: 1000,
  testCaseName: 'Test Case 1',
  ...overrides,
});

const makeSections = (hasPinned: boolean): ComparisonSection[] => [
  {
    key: 'execution',
    label: 'Execution',
    rows: [
      {
        fieldKey: 'status',
        label: 'status',
        isNumeric: false,
        values: hasPinned ? [{ raw: 'SUCCESS' }, { raw: 'FAILED' }] : [{ raw: 'SUCCESS' }],
      },
    ],
  },
];

beforeEach(() => {
  capturedColumnDefs = undefined;
  capturedRowData = undefined;
});

describe('ComparisonPivotView', () => {
  it('renders test case as row', () => {
    render(
      <ComparisonPivotView
        sections={makeSections(false)}
        activeDetail={makeDetail()}
        pinnedDetail={null}
        spotlightedFields={new Set()}
      />,
    );
    expect(screen.getByText('Test Case 1')).toBeInTheDocument();
  });

  it('builds column defs with field columns grouped by section', () => {
    render(
      <ComparisonPivotView
        sections={makeSections(false)}
        activeDetail={makeDetail()}
        pinnedDetail={null}
        spotlightedFields={new Set()}
      />,
    );
    expect(capturedColumnDefs).toBeDefined();
    // First col is the test case column
    const testCaseCol = capturedColumnDefs![0] as ColDef;
    expect(testCaseCol.colId).toBe('_testCaseName');

    // Second item is a column group for "Execution"
    const group = capturedColumnDefs![1] as ColGroupDef;
    expect(group.headerName).toBe('Runs.Execution');
    expect(group.children).toHaveLength(1);
    expect((group.children[0] as ColDef).headerName).toBe('status');
  });

  it('renders two rows when pinned', () => {
    const pinnedDetail = makeDetail({ id: 'r2', testCaseName: 'Test Case 2' });
    render(
      <ComparisonPivotView
        sections={makeSections(true)}
        activeDetail={makeDetail()}
        pinnedDetail={pinnedDetail}
        spotlightedFields={new Set()}
      />,
    );
    expect(screen.getByText('Test Case 1')).toBeInTheDocument();
    expect(screen.getByText('Test Case 2')).toBeInTheDocument();
    expect(capturedRowData).toHaveLength(2);
  });

  it('applies diff class on active row cell data', () => {
    const pinnedDetail = makeDetail({ id: 'r2', testCaseName: 'Test Case 2' });
    render(
      <ComparisonPivotView
        sections={makeSections(true)}
        activeDetail={makeDetail()}
        pinnedDetail={pinnedDetail}
        spotlightedFields={new Set()}
      />,
    );
    // Row 0 is active — no diff class; row 1 is pinned/compared — should have diff class
    const rows = capturedRowData as any[];
    const activeCell = rows[0]['execution:status'];
    const pinnedCell = rows[1]['execution:status'];
    expect(activeCell.diffClass).toBe('');
    // Text diff -> accent-secondary-alpha
    expect(pinnedCell.diffClass).toBe('bg-accent-secondary-alpha');
  });

  it('marks spotlighted field column with spotlight header class', () => {
    render(
      <ComparisonPivotView
        sections={makeSections(false)}
        activeDetail={makeDetail()}
        pinnedDetail={null}
        spotlightedFields={new Set(['execution:status'])}
      />,
    );
    const group = capturedColumnDefs![1] as ColGroupDef;
    const fieldCol = group.children[0] as ColDef;
    expect(fieldCol.headerClass).toContain('pivot-spotlight-header');
  });

  it('has fadeIn animation class', () => {
    const { container } = render(
      <ComparisonPivotView
        sections={makeSections(false)}
        activeDetail={makeDetail()}
        pinnedDetail={null}
        spotlightedFields={new Set()}
      />,
    );
    expect(container.querySelector('.animate-fadeIn')).toBeInTheDocument();
  });

  it('renders single row when pinned === active', () => {
    const detail = makeDetail();
    render(
      <ComparisonPivotView
        sections={makeSections(false)}
        activeDetail={detail}
        pinnedDetail={detail}
        spotlightedFields={new Set()}
      />,
    );
    const rows = screen.getAllByText('Test Case 1');
    expect(rows).toHaveLength(1);
    expect(capturedRowData).toHaveLength(1);
  });
});
