import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { SINGLE_RUN_COLUMNS } from '@/src/components/Runs/Details/ValuePopups/constants';
import FieldCompareModal from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/FieldCompareModal';
import ScoreModal from '@/src/components/Runs/Details/ValuePopups/ScoreModal';
import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { CompareRun } from '@/src/components/Runs/Compare/models';
import { getCompareRuns } from '@/src/components/Runs/Compare/utils';
import { RowDetailField } from '@/src/components/Runs/Details/RowDetails/models';
import { ErrorI18nKey, RunsI18nKey } from '@/src/constants/i18n';

vi.mock('@/src/components/Runs/Details/BottomDrawer/FullscreenDiffViewer', () => ({
  default: ({ fieldLabel, original, modified }: { fieldLabel: string; original: string; modified: string }) => (
    <div role="dialog" aria-label="diff-viewer">
      <span>{fieldLabel}</span>
      <span>{original}</span>
      <span>{modified}</span>
    </div>
  ),
}));

const runs = getCompareRuns({ id: 'run-1', name: 'Run A' }, { id: 'run-2', name: 'Run B' });
const getRunLabel = (run: CompareRun) => run.name;

const makeField = (overrides: Partial<RowDetailField> = {}): RowDetailField => ({
  fieldKey: 'score',
  label: 'exact_match',
  primaryRaw: '0',
  secondaryRaw: '1',
  diffKind: MetricDeltaKind.Changed,
  isNumeric: true,
  isScoreIndicator: true,
  isMetric: true,
  primaryInfo: { reason: 'primary reason', logs: 'primary logs', error: null, details: null },
  secondaryInfo: { reason: 'secondary reason', logs: 'secondary logs', error: null, details: null },
  ...overrides,
});

const renderModal = (field: RowDetailField, hasComparedMatch = true) => {
  const onClose = vi.fn();
  render(
    <FieldCompareModal
      field={field}
      runs={runs}
      hasComparedMatch={hasComparedMatch}
      getRunLabel={getRunLabel}
      onClose={onClose}
    />,
  );
  return { onClose };
};

let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  user = userEvent.setup();
});

const getColumn = (name: string) => screen.getByRole('region', { name });

describe('FieldCompareModal', () => {
  describe('non-metric field', () => {
    test('Should open the text diff of both runs', () => {
      renderModal(
        makeField({ isMetric: false, fieldKey: 'answer', label: 'answer', primaryRaw: 'left', secondaryRaw: 'right' }),
      );

      expect(screen.getByText('left')).toBeInTheDocument();
      expect(screen.getByText('right')).toBeInTheDocument();
      expect(screen.queryByText(RunsI18nKey.MetricScoreLabel)).not.toBeInTheDocument();
    });
  });

  describe('metric field', () => {
    test('Should show a column per run with its score', () => {
      renderModal(makeField());

      expect(within(getColumn('Run A')).getByText('0')).toHaveClass('bg-score-abs-00');
      expect(within(getColumn('Run B')).getByText('1')).toHaveClass('bg-score-abs-11');
    });

    test('Should open reason and keep logs collapsed by default', () => {
      renderModal(makeField());

      const left = getColumn('Run A');
      expect(within(left).getByRole('button', { name: RunsI18nKey.MetricReason, expanded: true })).toBeInTheDocument();
      expect(within(left).getByRole('button', { name: RunsI18nKey.MetricLogs, expanded: false })).toBeInTheDocument();
      expect(within(left).getByText('primary reason')).toBeInTheDocument();
      expect(within(left).queryByText('primary logs')).not.toBeInTheDocument();
    });

    test('Should expand a section in both columns together', async () => {
      renderModal(makeField());

      await user.click(within(getColumn('Run A')).getByRole('button', { name: RunsI18nKey.MetricLogs }));

      expect(within(getColumn('Run A')).getByText('primary logs')).toBeInTheDocument();
      expect(within(getColumn('Run B')).getByText('secondary logs')).toBeInTheDocument();
    });

    test('Should close the other section when one opens', async () => {
      renderModal(makeField());

      await user.click(within(getColumn('Run A')).getByRole('button', { name: RunsI18nKey.MetricLogs }));

      expect(screen.queryByText('primary reason')).not.toBeInTheDocument();
      expect(screen.queryByText('secondary reason')).not.toBeInTheDocument();
      expect(
        within(getColumn('Run B')).getByRole('button', { name: RunsI18nKey.MetricReason, expanded: false }),
      ).toBeInTheDocument();

      await user.click(within(getColumn('Run B')).getByRole('button', { name: RunsI18nKey.MetricReason }));

      expect(screen.getByText('primary reason')).toBeInTheDocument();
      expect(screen.queryByText('primary logs')).not.toBeInTheDocument();
    });

    test('Should collapse the open section in both columns together', async () => {
      renderModal(makeField());

      await user.click(within(getColumn('Run B')).getByRole('button', { name: RunsI18nKey.MetricReason }));

      expect(screen.queryByText('primary reason')).not.toBeInTheDocument();
      expect(screen.queryByText('secondary reason')).not.toBeInTheDocument();
    });

    test('Should omit a section neither run has', () => {
      renderModal(
        makeField({
          primaryInfo: { reason: 'primary reason', logs: null, error: null, details: null },
          secondaryInfo: { reason: 'secondary reason', logs: null, error: null, details: null },
        }),
      );

      expect(screen.queryByRole('button', { name: RunsI18nKey.MetricLogs })).not.toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: RunsI18nKey.MetricReason })).toHaveLength(2);
    });

    test('Should show a section only in the column of a run that has content for it', () => {
      renderModal(makeField({ secondaryInfo: undefined }));

      expect(within(getColumn('Run A')).getByRole('button', { name: RunsI18nKey.MetricReason })).toBeInTheDocument();
      expect(
        within(getColumn('Run B')).queryByRole('button', { name: RunsI18nKey.MetricReason }),
      ).not.toBeInTheDocument();
      expect(within(getColumn('Run B')).getByText('1')).toBeInTheDocument();
    });

    test('Should show only the score when no run has reason or logs', () => {
      renderModal(makeField({ primaryInfo: undefined, secondaryInfo: undefined }));

      expect(screen.queryByRole('button', { name: RunsI18nKey.MetricReason })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: RunsI18nKey.MetricLogs })).not.toBeInTheDocument();
      expect(within(getColumn('Run A')).getByText('0')).toBeInTheDocument();
    });

    test('Should show the error chip and the group error as reason for a failed run', () => {
      renderModal(
        makeField({
          primaryRaw: null,
          primaryFailed: true,
          primaryInfo: { reason: null, logs: null, error: '422 Unprocessable Content', details: null },
          secondaryInfo: undefined,
        }),
      );

      const left = getColumn('Run A');
      expect(within(left).getByText('422 Unprocessable Content')).toBeInTheDocument();
      expect(within(left).getAllByText(ErrorI18nKey.Error)).toHaveLength(2);
      expect(within(left).getByRole('button', { name: ErrorI18nKey.Error })).toBeInTheDocument();
      expect(within(left).queryByRole('button', { name: RunsI18nKey.MetricReason })).not.toBeInTheDocument();
      expect(within(left).queryByRole('button', { name: RunsI18nKey.MetricLogs })).not.toBeInTheDocument();
    });

    test('Should show the no-match placeholder instead of cards for a run without a match', () => {
      renderModal(makeField({ secondaryRaw: null, secondaryInfo: undefined }), false);

      const right = getColumn('Run B');
      expect(within(right).getByText(RunsI18nKey.RunCompareNoMatch)).toBeInTheDocument();
      expect(within(right).queryByText(RunsI18nKey.MetricScoreLabel)).not.toBeInTheDocument();
      expect(within(right).queryByRole('button')).not.toBeInTheDocument();
    });

    test('Should have no fullscreen button on any card of any run', async () => {
      renderModal(makeField());

      await user.click(within(getColumn('Run B')).getByRole('button', { name: RunsI18nKey.MetricLogs }));

      expect(screen.queryAllByRole('button', { name: RunsI18nKey.OpenFullscreen })).toHaveLength(0);
      expect(
        within(getColumn('Run A')).getByRole('button', { name: `copy ${RunsI18nKey.MetricLogs}` }),
      ).toBeInTheDocument();
    });

    describe('details', () => {
      const PRIMARY_DETAILS = '{\n  "tp": 1,\n  "false_positives": []\n}';
      const SECONDARY_DETAILS = '{\n  "tp": 2\n}';

      const getCardTitles = (column: HTMLElement) => {
        const titles: string[] = [RunsI18nKey.MetricReason, RunsI18nKey.MetricDetails, RunsI18nKey.MetricLogs];
        return within(column)
          .getAllByRole('button')
          .map((button) => button.textContent ?? '')
          .filter((title) => titles.includes(title));
      };

      const makeFieldWithDetails = (overrides: Partial<RowDetailField> = {}) =>
        makeField({
          primaryInfo: { reason: 'primary reason', logs: 'primary logs', error: null, details: PRIMARY_DETAILS },
          secondaryInfo: {
            reason: 'secondary reason',
            logs: 'secondary logs',
            error: null,
            details: SECONDARY_DETAILS,
          },
          ...overrides,
        });

      test('Should show the details card between reason and logs, collapsed behind the reason', () => {
        renderModal(makeFieldWithDetails());

        const left = getColumn('Run A');
        expect(getCardTitles(left)).toEqual([
          RunsI18nKey.MetricReason,
          RunsI18nKey.MetricDetails,
          RunsI18nKey.MetricLogs,
        ]);
        expect(
          within(left).getByRole('button', { name: RunsI18nKey.MetricReason, expanded: true }),
        ).toBeInTheDocument();
        expect(
          within(left).getByRole('button', { name: RunsI18nKey.MetricDetails, expanded: false }),
        ).toBeInTheDocument();
        expect(within(left).queryByText(/"tp": 1/)).not.toBeInTheDocument();
      });

      test('Should show each run its own details once the card is opened', async () => {
        renderModal(makeFieldWithDetails());

        await user.click(within(getColumn('Run A')).getByRole('button', { name: RunsI18nKey.MetricDetails }));

        expect(within(getColumn('Run A')).getByText(/"tp": 1/)).toBeInTheDocument();
        expect(within(getColumn('Run B')).getByText(/"tp": 2/)).toBeInTheDocument();
      });

      test('Should close the reason when the details open', async () => {
        renderModal(makeFieldWithDetails());

        await user.click(within(getColumn('Run A')).getByRole('button', { name: RunsI18nKey.MetricDetails }));

        expect(screen.queryByText('primary reason')).not.toBeInTheDocument();
        expect(screen.queryByText('primary logs')).not.toBeInTheDocument();
        expect(
          within(getColumn('Run B')).getByRole('button', { name: RunsI18nKey.MetricReason, expanded: false }),
        ).toBeInTheDocument();
      });

      test('Should open the details when no run has a reason', () => {
        renderModal(
          makeFieldWithDetails({
            primaryInfo: { reason: null, logs: null, error: null, details: PRIMARY_DETAILS },
            secondaryInfo: { reason: null, logs: null, error: null, details: SECONDARY_DETAILS },
          }),
        );

        expect(screen.getAllByRole('button', { name: RunsI18nKey.MetricDetails, expanded: true })).toHaveLength(2);
        expect(within(getColumn('Run A')).getByText(/"tp": 1/)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: RunsI18nKey.MetricReason })).not.toBeInTheDocument();
      });

      test('Should omit the details card of a run that has none', () => {
        renderModal(
          makeFieldWithDetails({
            secondaryInfo: { reason: 'secondary reason', logs: null, error: null, details: null },
          }),
        );

        expect(within(getColumn('Run A')).getByRole('button', { name: RunsI18nKey.MetricDetails })).toBeInTheDocument();
        expect(
          within(getColumn('Run B')).queryByRole('button', { name: RunsI18nKey.MetricDetails }),
        ).not.toBeInTheDocument();
      });

      test('Should show no details card when no run has details', () => {
        renderModal(makeField());

        expect(screen.queryByRole('button', { name: RunsI18nKey.MetricDetails })).not.toBeInTheDocument();
      });

      test('Should offer copy and no fullscreen on the details card', () => {
        renderModal(makeFieldWithDetails());

        expect(
          within(getColumn('Run A')).getByRole('button', { name: `copy ${RunsI18nKey.MetricDetails}` }),
        ).toBeInTheDocument();
        expect(screen.queryAllByRole('button', { name: RunsI18nKey.OpenFullscreen })).toHaveLength(0);
      });
    });
  });
});

describe('ScoreModal — single run', () => {
  const renderSingle = (field: RowDetailField) =>
    render(
      <ScoreModal
        field={field}
        runs={SINGLE_RUN_COLUMNS}
        hasComparedMatch
        getRunLabel={() => field.label}
        onClose={vi.fn()}
      />,
    );

  test('Should show one column with the score, reason and logs of the run, and no run tag', () => {
    renderSingle(makeField());

    const column = screen.getByRole('region', { name: 'exact_match' });
    expect(within(column).getByText('0')).toHaveClass('bg-score-abs-00');
    expect(within(column).getByText('primary reason')).toBeInTheDocument();
    expect(within(column).getByRole('button', { name: RunsI18nKey.MetricLogs })).toBeInTheDocument();
    expect(screen.getAllByRole('region')).toHaveLength(1);
  });

  test('Should show the error chip and group error for a failed run', () => {
    renderSingle(
      makeField({
        primaryRaw: null,
        primaryFailed: true,
        primaryInfo: { reason: null, logs: null, error: '422 Unprocessable Content', details: null },
      }),
    );

    // The chip and the card that holds the error message are both titled with the error label.
    expect(screen.getAllByText(ErrorI18nKey.Error)).toHaveLength(2);
    expect(screen.getByText('422 Unprocessable Content')).toBeInTheDocument();
  });

  test('Should offer copy but no fullscreen button on a single run’s cards', () => {
    renderSingle(makeField());

    expect(screen.queryByRole('button', { name: RunsI18nKey.OpenFullscreen })).toBeNull();
    expect(screen.getByRole('button', { name: `copy ${RunsI18nKey.MetricReason}` })).toBeInTheDocument();
  });

  test('Should open the reason as the first card and the logs card collapsed', () => {
    renderSingle(makeField());

    expect(screen.getByRole('button', { name: RunsI18nKey.MetricReason, expanded: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: RunsI18nKey.MetricLogs, expanded: false })).toBeInTheDocument();
  });

  test('Should open the details of a metric that has no reason, as Set Comparison reports it', () => {
    renderSingle(
      makeField({
        primaryInfo: {
          reason: null,
          logs: null,
          error: null,
          details: '{\n  "tp": 1,\n  "true_positives": [\n    "rust"\n  ]\n}',
        },
      }),
    );

    expect(screen.getByRole('button', { name: RunsI18nKey.MetricDetails, expanded: true })).toBeInTheDocument();
    expect(screen.getByText(/"true_positives"/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: RunsI18nKey.MetricReason })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: RunsI18nKey.MetricLogs })).not.toBeInTheDocument();
  });
});
