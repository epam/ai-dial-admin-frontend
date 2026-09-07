import { useState } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import OutputBindingsEditor from '@/src/components/Analytics/Pipelines/Enrich/OutputBindingsEditor';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { EvaluatorVar } from '@/src/models/analytics/evaluator';
import { OutputBinding } from '@/src/models/analytics/pipeline';
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
    render(<OutputBindingsEditor columns={columns} vars={vars} isReady onChange={vi.fn()} {...props} />);

  test('prompts for an evaluator and a target table before either is resolved', () => {
    renderEditor({ isReady: false });

    expect(screen.getByText(AnalyticsPipelinesI18nKey.OutputBindingsEmpty)).toBeTruthy();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.AddBinding)).toBeNull();
  });

  test('opens on one empty row when the rule has no bindings', () => {
    renderEditor();

    expect(screen.getByText(AnalyticsPipelinesI18nKey.BindingColumn)).toBeTruthy();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.BindingVariable)).toBeTruthy();
    expect(screen.getAllByRole('group', { name: /OutputBindings/ })).toHaveLength(1);
  });

  test('shows each option with its type', async () => {
    const user = userEvent.setup();
    renderEditor({ bindings: [{ column: 'title', var: 'out_title' }] });

    await user.click(screen.getByText('title · string'));

    expect(screen.getByText('sentiment_score · decimal')).toBeTruthy();
  });

  test('withholds a column already chosen in a sibling row', async () => {
    const user = userEvent.setup();
    renderEditor({
      bindings: [
        { column: 'title', var: 'out_title' },
        { column: 'summary', var: 'out_summary' },
      ],
    });

    await user.click(screen.getByText('summary · string'));

    expect(screen.getAllByText('title · string')).toHaveLength(1);
    expect(screen.getByText('sentiment_score · decimal')).toBeTruthy();
  });

  test('withholds a variable already chosen in a sibling row', async () => {
    const user = userEvent.setup();
    renderEditor({
      bindings: [
        { column: 'title', var: 'out_summary' },
        { column: 'summary', var: 'out_title' },
      ],
    });

    await user.click(screen.getByText('out_title · string'));

    expect(screen.getAllByText('out_summary · string')).toHaveLength(1);
    expect(screen.getByText('out_score · double')).toBeTruthy();
  });

  test('marks a row whose column the target table no longer has', () => {
    renderEditor({ bindings: [{ column: 'removed', var: 'out_title' }] });

    expect(screen.getByText(AnalyticsPipelinesI18nKey.BindingUnavailable)).toBeTruthy();
  });

  test('marks a row whose variable the evaluator version no longer has', () => {
    renderEditor({ bindings: [{ column: 'title', var: 'removed' }] });

    expect(screen.getByText(AnalyticsPipelinesI18nKey.BindingUnavailable)).toBeTruthy();
  });

  test('shows a stranded value rather than reading as empty', () => {
    renderEditor({ bindings: [{ column: 'removed', var: 'title' }] });

    expect(screen.getByText('removed')).toBeTruthy();
  });

  test('flags a genuine type disagreement', () => {
    renderEditor({ bindings: [{ column: 'title', var: 'out_score' }] });

    expect(screen.getByText(AnalyticsPipelinesI18nKey.BindingTypeMismatch)).toBeTruthy();
  });

  test('does not flag a decimal column bound to a double variable', () => {
    renderEditor({ bindings: [{ column: 'sentiment_score', var: 'out_score' }] });

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.BindingTypeMismatch)).toBeNull();
  });

  test('names each row so its delete button is distinguishable', () => {
    renderEditor({
      bindings: [
        { column: 'title', var: 'out_title' },
        { column: 'summary', var: 'out_summary' },
      ],
    });

    expect(screen.getAllByRole('group', { name: /OutputBindings/ })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /Buttons.Delete/ })[0]).toHaveAccessibleName(
      expect.stringContaining('1'),
    );
  });

  test('adds a row without reporting it until it is complete', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderEditor({ bindings: [{ column: 'title', var: 'out_title' }], onChange });

    await user.click(screen.getByText(AnalyticsPipelinesI18nKey.AddBinding));

    // The new row is real in the editor but has nothing to say on the wire yet, so the rule is unchanged.
    expect(screen.getAllByRole('group', { name: /OutputBindings/ })).toHaveLength(2);
    expect(onChange).toHaveBeenCalledWith([{ column: 'title', var: 'out_title' }]);
  });

  test('keeps a half-filled row when a real parent echoes the emitted value back', async () => {
    const user = userEvent.setup();

    // A `vi.fn()` onChange never changes the `bindings` prop, so the sync effect never runs and the guard
    // under test is never exercised. This parent round-trips the value the way the form actually does.
    const Controlled = () => {
      const [bindings, setBindings] = useState<OutputBinding[]>([{ column: 'title', var: 'out_title' }]);
      return <OutputBindingsEditor bindings={bindings} columns={columns} vars={vars} isReady onChange={setBindings} />;
    };

    render(<Controlled />);

    await user.click(screen.getByText(AnalyticsPipelinesI18nKey.AddBinding));

    expect(screen.getAllByRole('group', { name: /OutputBindings/ })).toHaveLength(2);
  });

  test('removes a row', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderEditor({
      bindings: [
        { column: 'title', var: 'out_title' },
        { column: 'summary', var: 'out_summary' },
      ],
      onChange,
    });

    await user.click(screen.getAllByRole('button', { name: /Buttons.Delete/ })[0]);

    expect(onChange).toHaveBeenCalledWith([{ column: 'summary', var: 'out_summary' }]);
  });
});
