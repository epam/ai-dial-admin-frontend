import { render, screen } from '@testing-library/react';

import { AnalyticsResult } from '@/src/models/evaluation/run';

import { ComparisonSection } from '../types';

import ComparisonPivotView from '../ComparisonPivotView';

const makeDetail = (overrides: Partial<AnalyticsResult> = {}): AnalyticsResult => ({
  id: 'r1',
  responseStatusCode: 200,
  runIndex: 0,
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
        values: hasPinned
          ? [
              { raw: 'SUCCESS', display: null },
              { raw: 'FAILED', display: null },
            ]
          : [{ raw: 'SUCCESS', display: null }],
      },
    ],
  },
];

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

  it('renders field as column header', () => {
    render(
      <ComparisonPivotView
        sections={makeSections(false)}
        activeDetail={makeDetail()}
        pinnedDetail={null}
        spotlightedFields={new Set()}
      />,
    );
    expect(screen.getByText('status')).toBeInTheDocument();
    // CSS uppercase class renders "Execution" as "EXECUTION" visually
    expect(screen.getByText('Execution')).toBeInTheDocument();
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
  });

  it('applies diff highlighting on active row', () => {
    const pinnedDetail = makeDetail({ id: 'r2', testCaseName: 'Test Case 2' });
    const { container } = render(
      <ComparisonPivotView
        sections={makeSections(true)}
        activeDetail={makeDetail()}
        pinnedDetail={pinnedDetail}
        spotlightedFields={new Set()}
      />,
    );
    // Text diff -> teal
    const tealCells = container.querySelectorAll('.bg-teal-500\\/10');
    expect(tealCells.length).toBeGreaterThan(0);
  });

  it('shows spotlighted field with accent border', () => {
    const { container } = render(
      <ComparisonPivotView
        sections={makeSections(false)}
        activeDetail={makeDetail()}
        pinnedDetail={null}
        spotlightedFields={new Set(['execution:status'])}
      />,
    );
    const accentHeaders = container.querySelectorAll('.border-t-accent-primary');
    expect(accentHeaders.length).toBeGreaterThan(0);
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
  });
});
