import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import OutputBindingsEditor from '@/src/components/Analytics/EnrichmentRules/OutputBindingsEditor';
import { AnalyticsEnrichmentRulesI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { EvaluatorVar } from '@/src/models/analytics/evaluator';
import { AnalyticsTableColumn } from '@/src/models/analytics/table';

const columns: AnalyticsTableColumn[] = [
  { source_name: 'title', name: 'title', type: AnalyticsFieldType.String },
  { source_name: 'summary', name: 'summary', type: AnalyticsFieldType.String },
  { source_name: 'sentiment_score', name: 'sentiment_score', type: AnalyticsFieldType.Decimal },
];

const vars: EvaluatorVar[] = [
  { name: 'out_title', type: 'string' },
  { name: 'out_summary', type: 'string' },
  { name: 'out_score', type: 'double' },
];

describe('OutputBindingsEditor', () => {
  const renderEditor = (props?: Partial<Parameters<typeof OutputBindingsEditor>[0]>) =>
    render(
      <OutputBindingsEditor
        rows={[{ id: 'row-1', column: '', var: '' }]}
        columns={columns}
        vars={vars}
        isReady
        onChange={vi.fn()}
        {...props}
      />,
    );

  test('prompts for an evaluator and a target table before either is resolved', () => {
    renderEditor({ isReady: false });

    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.OutputBindingsEmpty)).toBeTruthy();
    expect(screen.queryByText(AnalyticsEnrichmentRulesI18nKey.AddBinding)).toBeNull();
  });

  test('renders a column and a variable select per row', () => {
    renderEditor();

    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.BindingColumn)).toBeTruthy();
    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.BindingVariable)).toBeTruthy();
  });

  test('shows each option with its type', async () => {
    const user = userEvent.setup();
    renderEditor({ rows: [{ id: 'row-1', column: 'title', var: '' }] });

    await user.click(screen.getByText('title · string'));

    expect(screen.getByText('sentiment_score · decimal')).toBeTruthy();
  });

  test('withholds a column already chosen in a sibling row', async () => {
    const user = userEvent.setup();
    renderEditor({
      rows: [
        { id: 'row-1', column: 'title', var: 'out_title' },
        { id: 'row-2', column: 'summary', var: '' },
      ],
    });

    await user.click(screen.getByText('summary · string'));

    expect(screen.getAllByText('title · string')).toHaveLength(1);
    expect(screen.getByText('sentiment_score · decimal')).toBeTruthy();
  });

  test('withholds a variable already chosen in a sibling row', async () => {
    const user = userEvent.setup();
    renderEditor({
      rows: [
        { id: 'row-1', column: 'title', var: 'out_summary' },
        { id: 'row-2', column: 'summary', var: 'out_title' },
      ],
    });

    await user.click(screen.getByText('out_title · string'));

    expect(screen.getAllByText('out_summary · string')).toHaveLength(1);
    expect(screen.getByText('out_score · double')).toBeTruthy();
  });

  test('marks a row whose column the target table no longer has', () => {
    renderEditor({ rows: [{ id: 'row-1', column: 'removed', var: 'out_title' }] });

    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.BindingUnavailable)).toBeTruthy();
  });

  test('marks a row whose variable the evaluator version no longer has', () => {
    renderEditor({ rows: [{ id: 'row-1', column: 'title', var: 'removed' }] });

    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.BindingUnavailable)).toBeTruthy();
  });

  test('shows a stranded value rather than reading as empty', () => {
    renderEditor({ rows: [{ id: 'row-1', column: 'removed', var: 'title' }] });

    expect(screen.getByText('removed')).toBeTruthy();
  });

  test('flags a genuine type disagreement', () => {
    renderEditor({ rows: [{ id: 'row-1', column: 'title', var: 'out_score' }] });

    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.BindingTypeMismatch)).toBeTruthy();
  });

  test('does not flag a decimal column bound to a double variable', () => {
    renderEditor({ rows: [{ id: 'row-1', column: 'sentiment_score', var: 'out_score' }] });

    expect(screen.queryByText(AnalyticsEnrichmentRulesI18nKey.BindingTypeMismatch)).toBeNull();
  });

  test('names each row so its delete button is distinguishable', () => {
    renderEditor({
      rows: [
        { id: 'row-1', column: 'title', var: 'out_title' },
        { id: 'row-2', column: 'summary', var: 'out_summary' },
      ],
    });

    expect(screen.getAllByRole('group', { name: /OutputBindings/ })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /Buttons.Delete/ })[0]).toHaveAccessibleName(
      expect.stringContaining('1'),
    );
  });

  test('adds a row', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderEditor({ onChange });

    await user.click(screen.getByText(AnalyticsEnrichmentRulesI18nKey.AddBinding));

    expect(onChange).toHaveBeenCalledWith([
      { id: 'row-1', column: '', var: '' },
      expect.objectContaining({ column: '', var: '' }),
    ]);
  });

  test('removes a row', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderEditor({
      rows: [
        { id: 'row-1', column: 'title', var: 'out_title' },
        { id: 'row-2', column: 'summary', var: 'out_summary' },
      ],
      onChange,
    });

    await user.click(screen.getAllByRole('button', { name: /Buttons.Delete/ })[0]);

    expect(onChange).toHaveBeenCalledWith([{ id: 'row-2', column: 'summary', var: 'out_summary' }]);
  });
});
