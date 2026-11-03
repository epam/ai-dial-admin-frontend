import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { RowDetailField } from '@/src/components/Runs/Details/RowDetails/models';
import { ErrorI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import RunValueModal from '../RunValueModal';

const makeField = (overrides: Partial<RowDetailField> = {}): RowDetailField => ({
  fieldKey: 'answer',
  label: 'answer',
  primaryRaw: 'Romans',
  secondaryRaw: null,
  diffKind: MetricDeltaKind.Empty,
  isNumeric: false,
  isScoreIndicator: false,
  isMetric: false,
  ...overrides,
});

const makeMetricField = (overrides: Partial<RowDetailField> = {}): RowDetailField =>
  makeField({
    fieldKey: 'exact_match',
    label: 'Equality check',
    primaryRaw: '0',
    isNumeric: true,
    isScoreIndicator: true,
    isMetric: true,
    primaryInfo: { reason: 'The answers differ', logs: 'verbose output', error: null },
    ...overrides,
  });

describe('RunValueModal', () => {
  const renderModal = (field: RowDetailField, onClose = vi.fn()) => {
    render(<RunValueModal field={field} onClose={onClose} />);
    return { onClose };
  };

  describe('text value', () => {
    test('opens the text popup with the field label and the complete value', () => {
      renderModal(makeField({ primaryRaw: 'Christianity was established by the Romans' }));

      expect(screen.getByRole('dialog', { name: 'answer' })).toBeInTheDocument();
      expect(screen.getByText('Christianity was established by the Romans')).toBeInTheDocument();
    });

    test('opens the text popup for a value that is missing', () => {
      renderModal(makeField({ primaryRaw: null }));

      expect(screen.getByRole('dialog', { name: 'answer' })).toBeInTheDocument();
    });

    test('does not show the score view for a non-metric field', () => {
      renderModal(makeField());

      expect(screen.queryByRole('button', { name: RunsI18nKey.MetricLogs })).toBeNull();
    });

    test('closes from the close control', async () => {
      const { onClose } = renderModal(makeField());

      await userEvent.setup().click(screen.getByRole('button', { name: /close/i }));

      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe('metric value', () => {
    test('opens the score popup titled with the metric name', () => {
      renderModal(makeMetricField());

      expect(screen.getByRole('dialog', { name: 'Equality check' })).toBeInTheDocument();
    });

    test('shows one column with the score chip in its bucket colour and no run tag', () => {
      renderModal(makeMetricField());

      expect(screen.getByText('0')).toHaveClass('bg-score-abs-00');
      expect(screen.getAllByRole('region')).toHaveLength(1);
    });

    test('opens the reason card and keeps the logs card collapsed', () => {
      renderModal(makeMetricField());

      expect(screen.getByRole('button', { name: RunsI18nKey.MetricReason, expanded: true })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: RunsI18nKey.MetricLogs, expanded: false })).toBeInTheDocument();
      expect(screen.getByText('The answers differ')).toBeInTheDocument();
    });

    test('shows the error chip and the group error for a failed metric', () => {
      renderModal(
        makeMetricField({
          primaryRaw: null,
          primaryFailed: true,
          primaryInfo: { reason: null, logs: null, error: '422 Unprocessable Content' },
        }),
      );

      expect(screen.getAllByText(ErrorI18nKey.Error)).toHaveLength(2);
      expect(screen.getByText('422 Unprocessable Content')).toBeInTheDocument();
    });

    test('shows only the score when the metric has no reason or logs', () => {
      renderModal(makeMetricField({ primaryInfo: undefined }));

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: RunsI18nKey.MetricReason })).toBeNull();
      expect(screen.queryByRole('button', { name: RunsI18nKey.MetricLogs })).toBeNull();
    });

    test('has no fullscreen button on its cards', () => {
      renderModal(makeMetricField());

      expect(screen.queryByRole('button', { name: RunsI18nKey.OpenFullscreen })).toBeNull();
    });

    test('closes from the close control', async () => {
      const { onClose } = renderModal(makeMetricField());

      await userEvent.setup().click(screen.getByRole('button', { name: /close/i }));

      expect(onClose).toHaveBeenCalledOnce();
    });
  });
});
