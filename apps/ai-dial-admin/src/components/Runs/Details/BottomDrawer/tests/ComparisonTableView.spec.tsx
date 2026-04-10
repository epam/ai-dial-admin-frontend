import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AnalyticsResult } from '@/src/models/evaluation/run';

import { ComparisonSection } from '../models';

import ComparisonTableView from '../ComparisonTableView';

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
        values: hasPinned ? [{ raw: 'SUCCESS' }, { raw: 'FAILED' }] : [{ raw: 'SUCCESS' }],
      },
      {
        fieldKey: 'duration',
        label: 'duration',
        isNumeric: true,
        values: hasPinned ? [{ raw: '1000' }, { raw: '2000' }] : [{ raw: '1000' }],
      },
    ],
  },
];

describe('ComparisonTableView', () => {
  const defaultProps = {
    sections: makeSections(false),
    activeDetail: makeDetail(),
    pinnedDetail: null as AnalyticsResult | null,
    spotlightedFields: new Set<string>(),
    onToggleSpotlight: vi.fn(),
  };

  it('renders section headers', () => {
    render(<ComparisonTableView {...defaultProps} />);
    expect(screen.getByText('Runs.Execution')).toBeInTheDocument();
  });

  it('renders field rows', () => {
    render(<ComparisonTableView {...defaultProps} />);
    expect(screen.getByText('status')).toBeInTheDocument();
    expect(screen.getByText('duration')).toBeInTheDocument();
  });

  it('renders values', () => {
    render(<ComparisonTableView {...defaultProps} />);
    // SUCCESS appears in both the header StatusBadge and the cell value
    expect(screen.getAllByText('SUCCESS').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('1000')).toBeInTheDocument();
  });

  it('collapses section on click', async () => {
    render(<ComparisonTableView {...defaultProps} />);
    const header = screen.getByText('Runs.Execution');
    await userEvent.click(header.closest('div[style]')!);
    expect(screen.queryByText('status')).not.toBeInTheDocument();
  });

  it('has fadeIn animation class', () => {
    const { container } = render(<ComparisonTableView {...defaultProps} />);
    expect(container.querySelector('.animate-fadeIn')).toBeInTheDocument();
  });

  it('applies diff highlight on active column when pinned exists', () => {
    const pinnedDetail = makeDetail({ id: 'r2', testCaseName: 'Test Case 2' });
    const sections = makeSections(true);
    const { container } = render(
      <ComparisonTableView {...defaultProps} sections={sections} pinnedDetail={pinnedDetail} />,
    );
    // The 'status' row has different text values -> should get teal diff
    const tealCells = container.querySelectorAll('.bg-accent-secondary-alpha');
    expect(tealCells.length).toBeGreaterThan(0);
  });

  it('applies amber diff for numeric fields', () => {
    const pinnedDetail = makeDetail({ id: 'r2', testCaseName: 'Test Case 2' });
    const sections = makeSections(true);
    const { container } = render(
      <ComparisonTableView {...defaultProps} sections={sections} pinnedDetail={pinnedDetail} />,
    );
    const amberCells = container.querySelectorAll('.bg-warning');
    expect(amberCells.length).toBeGreaterThan(0);
  });
});
