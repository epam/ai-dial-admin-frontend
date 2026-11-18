import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import {
  apply,
  applyButton,
  currentQuery,
  openAdd,
  openChip,
  pick,
  renderChipBar,
} from '@/src/components/Analytics/QueryBuilder/Chips/tests/chip-bar.fixture';
import { createGroup, createPredicate } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryBuilderState } from '@/src/models/analytics/query-builder';

const FILTER = 'QueryBuilder.Filter';
const COLUMN = /QueryChips.Column/;
const OPERATOR = /QueryBuilder.Operator/;
const VALUE = /QueryChips.Value/;

const withTitleFilter = (): Partial<QueryBuilderState> => ({
  filter: {
    ...createGroup(),
    children: [{ ...createPredicate(AnalyticsFieldType.String), field: 'title', value: 'bug' }],
  },
});

const field = (name: string) => ({ type: 'field', name });
const text = (value: string) => ({ type: 'value', value_type: 'string', value });

describe('FilterPanel', () => {
  test('keeps Apply disabled until both the column and its value are set', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, FILTER);

    expect(within(dialog).getByRole('heading', { name: 'QueryChips.AddFilter' })).toBeInTheDocument();
    expect(applyButton(dialog)).toBeDisabled();

    await pick(user, dialog, COLUMN, 'title');
    expect(applyButton(dialog)).toBeDisabled();

    await user.type(within(dialog).getByRole('textbox', { name: VALUE }), '  bug ');
    expect(applyButton(dialog)).toBeEnabled();

    await apply(user, dialog);

    expect(await screen.findByRole('button', { name: /title .* 'bug'/ })).toBeInTheDocument();
    expect(currentQuery().filter).toEqual({ op: 'and', args: [{ op: 'eq', args: [field('title'), text('bug')] }] });
  });

  test('offers the values of an enum column', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, FILTER);

    await pick(user, dialog, COLUMN, 'activity_type');
    await user.click(within(dialog).getByRole('combobox', { name: VALUE }));

    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['coding', 'writing']);
    expect(within(dialog).queryByRole('textbox', { name: VALUE })).toBeNull();
  });

  test('offers true and false for a boolean column', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, FILTER);

    await pick(user, dialog, COLUMN, 'is_resolved');
    expect(applyButton(dialog)).toBeDisabled();
    await user.click(within(dialog).getByRole('combobox', { name: VALUE }));
    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['QueryChips.ValueTrue', 'QueryChips.ValueFalse']);

    await user.click(screen.getByRole('option', { name: 'QueryChips.ValueFalse' }));
    await apply(user, dialog);

    expect(await screen.findByRole('button', { name: /is_resolved .* 'false'/ })).toBeInTheDocument();
    expect(currentQuery().filter).toEqual({
      op: 'and',
      args: [{ op: 'eq', args: [field('is_resolved'), { type: 'value', value_type: 'boolean', value: 'false' }] }],
    });
  });

  test('takes a comma-separated list for the in-list operator on a text column', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, FILTER);

    await pick(user, dialog, COLUMN, 'title');
    await pick(user, dialog, OPERATOR, 'querybuilder.operatorin');
    expect(applyButton(dialog)).toBeDisabled();

    await user.type(within(dialog).getByRole('textbox', { name: VALUE }), 'alpha, beta ,');
    await apply(user, dialog);

    expect(await screen.findByRole('button', { name: /title .* 'alpha', 'beta'/ })).toBeInTheDocument();
    expect(currentQuery().filter).toEqual({
      op: 'and',
      args: [{ op: 'in', args: [field('title'), { type: 'array', items: [text('alpha'), text('beta')] }] }],
    });
  });

  test('takes several enum values for the in-list operator on an enum column', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, FILTER);

    await pick(user, dialog, COLUMN, 'activity_type');
    await pick(user, dialog, OPERATOR, 'querybuilder.operatorin');
    expect(applyButton(dialog)).toBeDisabled();

    await user.click(within(dialog).getByRole('combobox', { name: VALUE }));
    await user.click(await screen.findByRole('option', { name: 'coding' }));
    await user.click(await screen.findByRole('option', { name: 'writing' }));
    await apply(user, dialog);

    expect(await screen.findByRole('button', { name: /activity_type .* 'coding', 'writing'/ })).toBeInTheDocument();
    expect(currentQuery().filter).toEqual({
      op: 'and',
      args: [{ op: 'in', args: [field('activity_type'), { type: 'array', items: [text('coding'), text('writing')] }] }],
    });
  });

  test.each([
    ['querychips.operatorisempty', 'eq'],
    ['querychips.operatorisnotempty', 'ne'],
  ])('asks for no value with the %s operator', async (operator, op) => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, FILTER);

    await pick(user, dialog, COLUMN, 'title');
    await pick(user, dialog, OPERATOR, operator);

    expect(within(dialog).queryByRole('textbox', { name: VALUE })).toBeNull();
    expect(within(dialog).queryByRole('combobox', { name: VALUE })).toBeNull();
    expect(applyButton(dialog)).toBeEnabled();

    await apply(user, dialog);

    expect(await screen.findByRole('button', { name: /^title / })).toBeInTheDocument();
    expect(currentQuery().filter).toEqual({
      op: 'and',
      args: [{ op, args: [field('title'), { type: 'value', value_type: 'null', value: null }] }],
    });
  });

  test('withholds the contains operators from an enum column', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, FILTER);

    await pick(user, dialog, COLUMN, 'activity_type');
    await user.click(within(dialog).getByRole('combobox', { name: OPERATOR }));

    expect(await screen.findByRole('option', { name: 'querybuilder.operatoreq' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'querybuilder.operatorco' })).toBeNull();
    expect(screen.queryByRole('option', { name: 'querybuilder.operatornc' })).toBeNull();
  });

  test('resets the operator and the value when the new column does not support them', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, FILTER);

    await pick(user, dialog, COLUMN, 'title');
    await pick(user, dialog, OPERATOR, 'querybuilder.operatorco');
    await user.type(within(dialog).getByRole('textbox', { name: VALUE }), 'bug');
    expect(applyButton(dialog)).toBeEnabled();

    await pick(user, dialog, COLUMN, 'activity_type');

    expect(
      await within(dialog).findByRole('combobox', { name: 'QueryBuilder.Operator, querybuilder.operatoreq' }),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('combobox', { name: 'QueryChips.Value' })).toBeInTheDocument();
    expect(applyButton(dialog)).toBeDisabled();
  });

  test('clears the value when the column changes', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, FILTER);

    await pick(user, dialog, COLUMN, 'title');
    await user.type(within(dialog).getByRole('textbox', { name: VALUE }), 'bug');
    await pick(user, dialog, COLUMN, 'Cost');

    expect(await within(dialog).findByRole('combobox', { name: 'QueryChips.Column, Cost' })).toBeInTheDocument();
    expect(within(dialog).getByRole('textbox', { name: VALUE })).toHaveValue('');
    expect(applyButton(dialog)).toBeDisabled();
  });

  test('opens an existing filter with its predicate and rewrites it on Apply', async () => {
    const user = userEvent.setup();
    renderChipBar({ initial: withTitleFilter() });
    const dialog = await openChip(user, /title .* 'bug'/);

    expect(within(dialog).getByRole('heading', { name: FILTER })).toBeInTheDocument();
    expect(within(dialog).getByRole('combobox', { name: 'QueryChips.Column, title' })).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Buttons.Back' })).toBeNull();
    const value = within(dialog).getByRole('textbox', { name: VALUE });
    expect(value).toHaveValue('bug');

    await pick(user, dialog, OPERATOR, 'querybuilder.operatorne');
    await user.clear(value);
    await user.type(value, 'chore');
    await apply(user, dialog);

    expect(await screen.findByRole('button', { name: /title .* 'chore'/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /title .* 'bug'/ })).toBeNull();
    expect(currentQuery().filter).toEqual({ op: 'and', args: [{ op: 'ne', args: [field('title'), text('chore')] }] });
  });

  test('removes an existing filter', async () => {
    const user = userEvent.setup();
    renderChipBar({ initial: withTitleFilter() });
    const dialog = await openChip(user, /title .* 'bug'/);

    await user.click(within(dialog).getByRole('button', { name: 'Buttons.Remove' }));

    expect(await screen.findByRole('button', { name: 'QueryChips.AddPart' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: /title/ })).toBeNull();
    expect(currentQuery().filter).toBeUndefined();
  });
});
