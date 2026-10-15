import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { RowDetailField, RowDetailSection } from '@/src/components/Runs/Details/RowDetails/models';
import { scrollPivotToField } from '@/src/components/Runs/Details/RowDetails/utils/scroll-pivot-to-field';
import { BasicI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import ExecutionRowDetailTable from '../ExecutionRowDetailTable';

vi.mock('@/src/components/Runs/Details/RowDetails/utils/scroll-pivot-to-field', () => ({
  scrollPivotToField: vi.fn(),
}));

vi.mock('@/src/components/Runs/View/RowDetails/FullscreenValueViewer', () => ({
  default: ({ fieldLabel, value }: { fieldLabel: string; value: string }) => (
    <div role="dialog" aria-label={fieldLabel}>
      {value}
    </div>
  ),
}));

vi.mock('@/src/components/Runs/Details/RowDetails/FieldValue', () => ({
  default: ({ raw, onOverflowChange }: { raw: string | null; onOverflowChange?: (value: boolean) => void }) => {
    onOverflowChange?.(raw != null && raw.length > 40);
    return <span>{raw ?? '—'}</span>;
  },
}));

const row = (fieldKey: string, label: string, primaryRaw: string | null, extra: Partial<RowDetailField> = {}) => ({
  fieldKey,
  label,
  primaryRaw,
  secondaryRaw: null,
  diffKind: MetricDeltaKind.Empty,
  isNumeric: false,
  isScoreIndicator: false,
  isMetric: false,
  ...extra,
});

const sections: RowDetailSection[] = [
  {
    key: 'testCaseData',
    label: 'Test Case Data',
    rows: [row('question', 'question', 'Who established Christianity?'), row('answer', 'answer', 'Romans')],
  },
  {
    key: 'extractedColumns',
    label: 'Extracted',
    rows: [
      row('context', 'context', 'up a charter that is considered to be a declaration of independence'),
      row('missing', 'missing', null),
    ],
  },
  {
    key: 'metric:Accuracy',
    label: 'Accuracy',
    rows: [row('equality', 'Equality check', '0.000', { isNumeric: true, isMetric: true })],
  },
];

describe('ExecutionRowDetailTable', () => {
  beforeEach(() => {
    vi.mocked(scrollPivotToField).mockClear();
  });

  test('shows a Field and a Values header and no comparison columns', () => {
    render(<ExecutionRowDetailTable sections={sections} />);

    expect(screen.getByText(RunsI18nKey.FieldColumn)).toBeInTheDocument();
    expect(screen.getByText(RunsI18nKey.ValueColumn)).toBeInTheDocument();
    expect(screen.queryByText('Delta')).not.toBeInTheDocument();
    expect(screen.getAllByPlaceholderText(BasicI18nKey.Search)).toHaveLength(2);
  });

  test('lists every section expanded with its rows', () => {
    render(<ExecutionRowDetailTable sections={sections} />);

    expect(screen.getByRole('button', { name: RunsI18nKey.TestCaseData })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Romans')).toBeInTheDocument();
    expect(screen.getByText('Equality check')).toBeInTheDocument();
  });

  test('renders a missing value as a dash', () => {
    render(<ExecutionRowDetailTable sections={sections} />);

    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  test('collapses and re-expands a section', async () => {
    render(<ExecutionRowDetailTable sections={sections} />);
    const toggle = screen.getByRole('button', { name: RunsI18nKey.TestCaseData });

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Romans')).not.toBeInTheDocument();

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Romans')).toBeInTheDocument();
  });

  test('narrows rows by field search and hides sections left empty', async () => {
    render(<ExecutionRowDetailTable sections={sections} />);

    await userEvent.type(screen.getAllByPlaceholderText(BasicI18nKey.Search)[0], 'equal');

    expect(screen.getByText('Equality check')).toBeInTheDocument();
    expect(screen.queryByText('Romans')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: RunsI18nKey.TestCaseData })).not.toBeInTheDocument();
  });

  test('narrows rows by value search', async () => {
    render(<ExecutionRowDetailTable sections={sections} />);

    await userEvent.type(screen.getAllByPlaceholderText(BasicI18nKey.Search)[1], 'Roman');

    expect(screen.getByText('Romans')).toBeInTheDocument();
    expect(screen.queryByText('Equality check')).not.toBeInTheDocument();
  });

  test('shows no sections when nothing matches', async () => {
    render(<ExecutionRowDetailTable sections={sections} />);

    await userEvent.type(screen.getAllByPlaceholderText(BasicI18nKey.Search)[0], 'zzz');

    expect(screen.queryByRole('button', { expanded: true })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { expanded: false })).not.toBeInTheDocument();
  });

  test('scrolls to the focus field', async () => {
    render(<ExecutionRowDetailTable sections={sections} focusFieldKey="answer" focusRequestId={1} />);

    await waitFor(() => {
      expect(scrollPivotToField).toHaveBeenCalledWith(expect.any(HTMLElement), 'answer');
    });
  });

  test('opens the full-value popup for a clipped value', async () => {
    render(<ExecutionRowDetailTable sections={sections} />);

    await userEvent.click(screen.getAllByRole('button', { name: RunsI18nKey.OpenFullValue })[0]);

    const dialog = screen.getByRole('dialog', { name: 'context' });
    expect(within(dialog).getByText(/up a charter/)).toBeInTheDocument();
  });
});
