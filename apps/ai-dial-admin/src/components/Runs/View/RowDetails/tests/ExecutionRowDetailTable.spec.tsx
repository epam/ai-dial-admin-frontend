import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentProps } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { RowDetailField, RowDetailSection } from '@/src/components/Runs/Details/RowDetails/models';
import { scrollPivotToField } from '@/src/components/Runs/Details/RowDetails/utils/scroll-pivot-to-field';
import { BasicI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import ExecutionRowDetailTable from '../ExecutionRowDetailTable';

vi.mock('@/src/components/Runs/Details/RowDetails/utils/scroll-pivot-to-field', () => ({
  scrollPivotToField: vi.fn(),
}));

vi.mock('@/src/components/Runs/View/RowDetails/RunValueModal', () => ({
  default: ({ field, onClose }: { field: RowDetailField; onClose: () => void }) => (
    <div role="dialog" aria-label={field.label}>
      <span>{field.isMetric ? 'score popup' : 'text popup'}</span>
      <span>{field.primaryRaw}</span>
      <button onClick={onClose}>close popup</button>
    </div>
  ),
}));

const row = (fieldKey: string, primaryRaw: string | null, overrides: Partial<RowDetailField> = {}): RowDetailField => ({
  fieldKey,
  label: fieldKey,
  primaryRaw,
  secondaryRaw: null,
  diffKind: MetricDeltaKind.Empty,
  isNumeric: false,
  isScoreIndicator: false,
  isMetric: false,
  ...overrides,
});

const sections: RowDetailSection[] = [
  { key: 'execution', label: 'Execution', rows: [row('executionStatus', 'COMPLETED')] },
  { key: 'testCaseData', label: 'Test Case Data', rows: [row('question', 'Who established Christianity?')] },
  {
    key: 'extractedColumns',
    label: 'Extracted Columns',
    rows: [row('answer', 'Romans'), row('context', 'Roman monasteries')],
  },
  {
    key: 'metric:Accuracy',
    label: 'Accuracy',
    rows: [row('Accuracy_precision', '0.303', { isMetric: true, isNumeric: true, isScoreIndicator: true })],
  },
];

const getFieldRow = (fieldKey: string) => document.querySelector(`[data-field-key="${fieldKey}"]`);

describe('ExecutionRowDetailTable', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderTable = (props?: Partial<ComponentProps<typeof ExecutionRowDetailTable>>) =>
    render(<ExecutionRowDetailTable sections={sections} {...props} />);

  describe('structure', () => {
    test('shows the Field and Values column headers', () => {
      renderTable();

      expect(screen.getByText(RunsI18nKey.FieldColumn)).toBeTruthy();
      expect(screen.getByText(RunsI18nKey.ValuesColumn)).toBeTruthy();
    });

    test('shows a search field for each column', () => {
      renderTable();

      expect(screen.getAllByRole('textbox', { name: BasicI18nKey.Search })).toHaveLength(2);
    });

    test('orders the sections as execution, test case data, extracted columns, then metrics', () => {
      renderTable();

      const headers = [
        screen.getByRole('button', { name: RunsI18nKey.Execution }),
        screen.getByRole('button', { name: RunsI18nKey.TestCaseData }),
        screen.getByRole('button', { name: RunsI18nKey.ExtractedColumns }),
        screen.getByRole('button', { name: 'Accuracy' }),
      ];

      headers.slice(1).forEach((header, index) => {
        expect(headers[index].compareDocumentPosition(header) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      });
    });

    test('shows each field name next to its value', () => {
      renderTable();

      expect(getFieldRow('answer')).toBeTruthy();
      expect(screen.getByText('Romans')).toBeTruthy();
      expect(screen.getByText('0.303')).toBeTruthy();
    });
  });

  describe('sections', () => {
    test('collapses and expands a section from its header', async () => {
      const user = userEvent.setup();
      renderTable();
      const header = screen.getByRole('button', { name: RunsI18nKey.ExtractedColumns });

      expect(header).toHaveAttribute('aria-expanded', 'true');

      await user.click(header);

      expect(header).toHaveAttribute('aria-expanded', 'false');
      expect(getFieldRow('answer')).toBeNull();
      expect(getFieldRow('question')).toBeTruthy();

      await user.click(header);

      expect(header).toHaveAttribute('aria-expanded', 'true');
      expect(getFieldRow('answer')).toBeTruthy();
    });
  });

  describe('search', () => {
    test('narrows rows by field name and hides sections left empty', async () => {
      const user = userEvent.setup();
      renderTable();
      const [fieldSearch] = screen.getAllByRole('textbox', { name: BasicI18nKey.Search });

      await user.type(fieldSearch, 'ans');

      expect(getFieldRow('answer')).toBeTruthy();
      expect(getFieldRow('context')).toBeNull();
      expect(screen.queryByRole('button', { name: RunsI18nKey.Execution })).toBeNull();
      expect(screen.getByRole('button', { name: RunsI18nKey.ExtractedColumns })).toBeTruthy();
    });

    test('narrows rows by value', async () => {
      const user = userEvent.setup();
      renderTable();
      const [, valueSearch] = screen.getAllByRole('textbox', { name: BasicI18nKey.Search });

      await user.type(valueSearch, 'monasteries');

      expect(getFieldRow('context')).toBeTruthy();
      expect(getFieldRow('answer')).toBeNull();
    });

    test('ignores case when searching', async () => {
      const user = userEvent.setup();
      renderTable();
      const [, valueSearch] = screen.getAllByRole('textbox', { name: BasicI18nKey.Search });

      await user.type(valueSearch, 'ROMANS');

      expect(getFieldRow('answer')).toBeTruthy();
    });

    test('keeps the headers when nothing matches', async () => {
      const user = userEvent.setup();
      renderTable();
      const [fieldSearch] = screen.getAllByRole('textbox', { name: BasicI18nKey.Search });

      await user.type(fieldSearch, 'zzz');

      expect(getFieldRow('answer')).toBeNull();
      expect(screen.getByText(RunsI18nKey.FieldColumn)).toBeTruthy();
      expect(screen.getByText(RunsI18nKey.ValuesColumn)).toBeTruthy();
    });
  });

  describe('opening a value', () => {
    const getCellButton = (fieldKey: string) =>
      within(getFieldRow(fieldKey)!.nextElementSibling as HTMLElement).getByRole('button', {
        name: RunsI18nKey.OpenFullValue,
      });

    test('opens the text popup for the field of the clicked cell', async () => {
      const user = userEvent.setup();
      renderTable();

      await user.click(getCellButton('answer'));

      const dialog = screen.getByRole('dialog', { name: 'answer' });
      expect(within(dialog).getByText('text popup')).toBeTruthy();
      expect(within(dialog).getByText('Romans')).toBeTruthy();
    });

    test('opens the score popup for a metric cell', async () => {
      const user = userEvent.setup();
      renderTable();

      await user.click(getCellButton('Accuracy_precision'));

      expect(within(screen.getByRole('dialog', { name: 'Accuracy_precision' })).getByText('score popup')).toBeTruthy();
    });

    test('makes every cell clickable, including a short value and the status', () => {
      renderTable();

      expect(screen.getAllByRole('button', { name: RunsI18nKey.OpenFullValue })).toHaveLength(5);
    });

    test('closes the popup', async () => {
      const user = userEvent.setup();
      renderTable();
      await user.click(getCellButton('answer'));

      await user.click(screen.getByRole('button', { name: 'close popup' }));

      expect(screen.queryByRole('dialog')).toBeNull();
    });

    test('opens another field after the first is closed', async () => {
      const user = userEvent.setup();
      renderTable();
      await user.click(getCellButton('answer'));
      await user.click(screen.getByRole('button', { name: 'close popup' }));

      await user.click(getCellButton('question'));

      expect(screen.getByRole('dialog', { name: 'question' })).toBeTruthy();
    });
  });

  describe('focus', () => {
    test('scrolls to the focused field', async () => {
      renderTable({ focusFieldKey: 'answer' });

      await vi.waitFor(() => expect(scrollPivotToField).toHaveBeenCalledWith(expect.any(HTMLElement), 'answer'));
    });

    test('scrolls again when the same field is requested again', async () => {
      vi.mocked(scrollPivotToField).mockClear();
      const { rerender } = renderTable({ focusFieldKey: 'answer', focusRequestId: 1 });
      await vi.waitFor(() => expect(scrollPivotToField).toHaveBeenCalledOnce());

      rerender(<ExecutionRowDetailTable sections={sections} focusFieldKey="answer" focusRequestId={2} />);

      await vi.waitFor(() => expect(scrollPivotToField).toHaveBeenCalledTimes(2));
    });
  });
});
