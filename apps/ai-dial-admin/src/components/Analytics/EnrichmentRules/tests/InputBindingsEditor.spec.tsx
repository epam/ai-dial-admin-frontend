import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import InputBindingsEditor from '@/src/components/Analytics/EnrichmentRules/InputBindingsEditor';
import MemberSelectEditor from '@/src/components/Analytics/EnrichmentRules/MemberSelectEditor';
import OrderByEditor from '@/src/components/Analytics/EnrichmentRules/OrderByEditor';
import { toInputBindings, toInputBindingRows } from '@/src/components/Analytics/EnrichmentRules/input-bindings';
import { AnalyticsEnrichmentRulesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { EvaluatorVar } from '@/src/models/analytics/evaluator';
import { InputBindingKind } from '@/src/models/analytics/enrichment-rules-ui';
import { SortDirection } from '@/src/models/analytics/rule';
import { AnalyticsTableColumn } from '@/src/models/analytics/table';

const columns: AnalyticsTableColumn[] = [
  { source_name: 'chat_id', name: 'chat_id', type: AnalyticsFieldType.String },
  { source_name: 'content', name: 'content', type: AnalyticsFieldType.String },
];

const vars: EvaluatorVar[] = [
  { name: 'in_chat', type: 'string' },
  { name: 'in_text', type: 'string' },
];

describe('InputBindingsEditor', () => {
  const renderEditor = (props?: Partial<Parameters<typeof InputBindingsEditor>[0]>) =>
    render(<InputBindingsEditor columns={columns} vars={vars} isReady onChange={vi.fn()} {...props} />);

  test('prompts for the evaluator and the source before either resolves', () => {
    renderEditor({ isReady: false });

    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.InputBindingsEmpty)).toBeTruthy();
  });

  test('offers the read source columns, not the target enrichment columns', () => {
    renderEditor({ bindings: [{ var: 'in_chat', column: 'chat_id' }] });

    expect(screen.getByText('chat_id · string')).toBeTruthy();
  });

  test('withholds a variable already bound in a sibling row', async () => {
    const user = userEvent.setup();
    renderEditor({
      bindings: [
        { var: 'in_chat', column: 'chat_id' },
        { var: 'in_text', column: 'content' },
      ],
    });

    await user.click(screen.getByText('in_text · string'));

    expect(screen.getAllByText('in_chat · string')).toHaveLength(1);
  });

  test('renders an expression input when the row binds JSONata', () => {
    renderEditor({ bindings: [{ var: 'in_text', jsonata: '$.content' }] });

    expect(screen.getByDisplayValue('$.content')).toBeTruthy();
    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.BindingJsonata)).toBeTruthy();
  });

  test('clears the value when the row switches between column and expression', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderEditor({ bindings: [{ var: 'in_chat', column: 'chat_id' }], onChange });

    await user.click(screen.getByText(AnalyticsEnrichmentRulesI18nKey.BindingKindColumn));
    await user.click(screen.getByText(AnalyticsEnrichmentRulesI18nKey.BindingKindJsonata));

    // The row is now incomplete, so it drops out of the wire format rather than carrying the column name
    // across as an expression.
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  test('reports a row whose variable the evaluator no longer declares', () => {
    renderEditor({ bindings: [{ var: 'removed', column: 'chat_id' }] });

    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.BindingUnavailable)).toBeTruthy();
    expect(screen.getByText('removed')).toBeTruthy();
  });

  test('reports a row whose column the source no longer has', () => {
    renderEditor({ bindings: [{ var: 'in_chat', column: 'gone' }] });

    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.BindingUnavailable)).toBeTruthy();
  });

  test('does not report a JSONata expression as an unresolvable column', () => {
    renderEditor({ bindings: [{ var: 'in_chat', jsonata: 'not-a-column' }] });

    expect(screen.queryByText(AnalyticsEnrichmentRulesI18nKey.BindingUnavailable)).toBeNull();
  });

  test('removes a row', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderEditor({
      bindings: [
        { var: 'in_chat', column: 'chat_id' },
        { var: 'in_text', column: 'content' },
      ],
      onChange,
    });

    await user.click(screen.getAllByRole('button', { name: /Buttons.Delete/ })[0]);

    expect(onChange).toHaveBeenCalledWith([{ var: 'in_text', column: 'content' }]);
  });
});

describe('input-bindings', () => {
  test('omits a row naming a variable but no value', () => {
    expect(toInputBindings([{ id: 'a', var: 'in_chat', kind: InputBindingKind.Column, value: '' }])).toEqual([]);
  });

  test('omits a row naming a value but no variable', () => {
    expect(toInputBindings([{ id: 'a', var: '', kind: InputBindingKind.Column, value: 'chat_id' }])).toEqual([]);
  });

  test('emits the member the row kind names', () => {
    expect(
      toInputBindings([
        { id: 'a', var: 'in_chat', kind: InputBindingKind.Column, value: 'chat_id' },
        { id: 'b', var: 'in_text', kind: InputBindingKind.Jsonata, value: '$.content' },
      ]),
    ).toEqual([
      { var: 'in_chat', column: 'chat_id' },
      { var: 'in_text', jsonata: '$.content' },
    ]);
  });

  test('reads the kind back from which member the binding carries', () => {
    const rows = toInputBindingRows([{ var: 'in_text', jsonata: '$.content' }]);

    expect(rows[0].kind).toBe(InputBindingKind.Jsonata);
    expect(rows[0].value).toBe('$.content');
  });

  test('opens on one empty row when the rule has no input bindings', () => {
    expect(toInputBindingRows()).toHaveLength(1);
  });
});

describe('OrderByEditor', () => {
  const renderEditor = (props?: Partial<Parameters<typeof OrderByEditor>[0]>) =>
    render(<OrderByEditor columns={columns} onChange={vi.fn()} {...props} />);

  test('adds a complete entry rather than a blank one', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderEditor({ onChange });

    await user.click(screen.getByText(AnalyticsEnrichmentRulesI18nKey.AddOrderBy));

    expect(onChange).toHaveBeenCalledWith([{ column: 'chat_id', direction: SortDirection.Asc }]);
  });

  test('cannot add an entry before the source columns resolve', () => {
    renderEditor({ columns: [] });

    expect(screen.getByRole('button', { name: AnalyticsEnrichmentRulesI18nKey.AddOrderBy })).toBeDisabled();
  });

  test('removes an entry', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderEditor({
      orderBy: [
        { column: 'chat_id', direction: SortDirection.Asc },
        { column: 'content', direction: SortDirection.Desc },
      ],
      onChange,
    });

    await user.click(screen.getAllByRole('button', { name: /Buttons.Delete/ })[0]);

    expect(onChange).toHaveBeenCalledWith([{ column: 'content', direction: SortDirection.Desc }]);
  });
});

describe('MemberSelectEditor', () => {
  const renderEditor = (props?: Partial<Parameters<typeof MemberSelectEditor>[0]>) =>
    render(<MemberSelectEditor columns={columns} isLimitValid onChange={vi.fn()} {...props} />);

  test('describes the preference as a preference rather than a filter', () => {
    renderEditor();

    expect(screen.getByText(new RegExp(AnalyticsEnrichmentRulesI18nKey.PreferSqlCaption))).toBeTruthy();
  });

  test('reports the missing limit once anything is declared', () => {
    renderEditor({ memberSelect: { limit: 0, prefer_sql: 'x > 1' }, isLimitValid: false });

    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.MemberLimitRequired)).toBeTruthy();
  });

  test('drops member selection entirely when its last value is cleared', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderEditor({ memberSelect: { limit: 10 }, onChange });

    await user.clear(screen.getByLabelText(AnalyticsEnrichmentRulesI18nKey.MemberLimit, { exact: false }));

    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  test('keeps member selection while another value is still declared', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderEditor({ memberSelect: { limit: 10, prefer_sql: 'x > 1' }, onChange });

    await user.clear(screen.getByLabelText(AnalyticsEnrichmentRulesI18nKey.MemberLimit, { exact: false }));

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ prefer_sql: 'x > 1' }));
  });
});
