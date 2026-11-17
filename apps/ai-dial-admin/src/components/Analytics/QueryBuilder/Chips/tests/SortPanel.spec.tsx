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
import { createSort } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { QuerySortDirection } from '@/src/models/analytics/query';
import { QueryBuilderState } from '@/src/models/analytics/query-builder';

const SORT = 'QueryBuilder.Sort';
const FIELD = /QueryChips.Field/;
const DIRECTION = /QueryBuilder.Direction/;

const withTitleSort = (): Partial<QueryBuilderState> => ({
  sort: [{ ...createSort(), field: 'title', dir: QuerySortDirection.Asc }],
});

describe('SortPanel', () => {
  test('adds a sort key from a field and a direction', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, SORT);

    expect(within(dialog).getByRole('heading', { name: 'QueryChips.AddSort' })).toBeInTheDocument();
    expect(within(dialog).getByRole('combobox', { name: DIRECTION })).toHaveAccessibleName(
      'QueryBuilder.Direction, QueryBuilder.DirectionAsc',
    );
    expect(applyButton(dialog)).toBeDisabled();

    await pick(user, dialog, FIELD, 'Cost');
    await pick(user, dialog, DIRECTION, 'QueryBuilder.DirectionDesc');
    await apply(user, dialog);

    expect(
      await screen.findByRole('button', { name: 'QueryBuilder.Sort: Cost QueryBuilder.DirectionDesc' }),
    ).toBeInTheDocument();
    expect(currentQuery().sort).toEqual([{ field: 'cost', dir: 'desc' }]);
  });

  test('offers every field of a row query', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, SORT);

    await user.click(within(dialog).getByRole('combobox', { name: FIELD }));

    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'activity_type',
      'Cost',
      'created_at',
      'is_resolved',
      'title',
    ]);
  });

  test('leaves out a field another sort key already uses', async () => {
    const user = userEvent.setup();
    renderChipBar({ initial: withTitleSort() });
    const dialog = await openAdd(user, SORT);

    await user.click(within(dialog).getByRole('combobox', { name: FIELD }));

    expect(await screen.findByRole('option', { name: 'Cost' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'title' })).toBeNull();
  });

  test('adds a second key as its own chip', async () => {
    const user = userEvent.setup();
    renderChipBar({ initial: withTitleSort() });
    const dialog = await openAdd(user, SORT);

    await pick(user, dialog, FIELD, 'created_at');
    await apply(user, dialog);

    expect(await screen.findByRole('button', { name: /QueryBuilder.Sort: created_at/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /QueryBuilder.Sort: title/ })).toBeInTheDocument();
    expect(currentQuery().sort).toEqual([
      { field: 'title', dir: 'asc' },
      { field: 'created_at', dir: 'asc' },
    ]);
  });

  test('keeps the edited key in its own field list and rewrites it on Apply', async () => {
    const user = userEvent.setup();
    renderChipBar({ initial: withTitleSort() });
    const dialog = await openChip(user, /QueryBuilder.Sort: title/);

    expect(within(dialog).getByRole('heading', { name: SORT })).toBeInTheDocument();
    expect(within(dialog).getByRole('combobox', { name: FIELD })).toHaveAccessibleName('QueryChips.Field, title');
    expect(within(dialog).queryByRole('button', { name: 'Buttons.Back' })).toBeNull();

    await user.click(within(dialog).getByRole('combobox', { name: FIELD }));
    expect(await screen.findByRole('option', { name: 'title' })).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'is_resolved' }));
    await pick(user, dialog, DIRECTION, 'QueryBuilder.DirectionDesc');
    await apply(user, dialog);

    expect(await screen.findByRole('button', { name: /QueryBuilder.Sort: is_resolved/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /QueryBuilder.Sort: title/ })).toBeNull();
    expect(currentQuery().sort).toEqual([{ field: 'is_resolved', dir: 'desc' }]);
  });

  test('removes a sort key', async () => {
    const user = userEvent.setup();
    renderChipBar({ initial: withTitleSort() });
    const dialog = await openChip(user, /QueryBuilder.Sort: title/);

    await user.click(within(dialog).getByRole('button', { name: 'Buttons.Remove' }));

    expect(await screen.findByRole('button', { name: 'QueryChips.AddPart' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: /QueryBuilder.Sort: title/ })).toBeNull();
    expect(currentQuery().sort).toBeUndefined();
  });
});
