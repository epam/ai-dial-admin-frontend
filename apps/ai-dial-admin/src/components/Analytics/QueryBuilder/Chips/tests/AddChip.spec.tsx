import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import {
  apply,
  currentQuery,
  openAdd,
  openAddMenu,
  pick,
  renderChipBar,
} from '@/src/components/Analytics/QueryBuilder/Chips/tests/chip-bar.fixture';
import { createColumnRow } from '@/src/components/Analytics/QueryBuilder/utils/state';

const ADD = 'QueryChips.AddPart';
const FILTER = 'QueryBuilder.Filter';
const AGGREGATE = 'QueryBuilder.Aggregate';
const COLUMNS = 'QueryChips.ShowColumns';
const SORT = 'QueryBuilder.Sort';

const addButton = () => screen.getByRole('button', { name: ADD });
const entry = (name: string) => screen.getByRole('menuitemcheckbox', { name });

describe('AddChip', () => {
  test('exposes a menu popup and its expanded state', async () => {
    const user = userEvent.setup();
    renderChipBar();

    expect(addButton()).toHaveAttribute('aria-haspopup', 'menu');
    expect(addButton()).toHaveAttribute('aria-expanded', 'false');

    await openAddMenu(user);

    expect(await screen.findByRole('menu')).toBeInTheDocument();
    expect(addButton()).toHaveAttribute('aria-expanded', 'true');
  });

  test('offers every part for an empty row query', async () => {
    const user = userEvent.setup();
    renderChipBar();

    await openAddMenu(user);

    expect((await screen.findAllByRole('menuitemcheckbox')).map((item) => item.textContent)).toEqual([
      FILTER,
      AGGREGATE,
      COLUMNS,
      SORT,
    ]);
    [FILTER, AGGREGATE, COLUMNS, SORT].forEach((name) =>
      expect(entry(name)).not.toHaveAttribute('aria-disabled', 'true'),
    );
  });

  test.each([
    [FILTER, 'QueryChips.AddFilter'],
    [AGGREGATE, 'QueryChips.AddAggregate'],
    [COLUMNS, COLUMNS],
    [SORT, 'QueryChips.AddSort'],
  ])('opens the %s popup as a dialog named by its title', async (name, title) => {
    const user = userEvent.setup();
    renderChipBar();

    await openAdd(user, name);

    expect(await screen.findByRole('dialog', { name: title })).toBeInTheDocument();
    expect(screen.queryByRole('menu')).toBeNull();
    expect(addButton()).toHaveAttribute('aria-expanded', 'true');
  });

  test('withholds Show columns once columns are chosen and keeps the other parts', async () => {
    const user = userEvent.setup();
    renderChipBar({ initial: { select: [createColumnRow('title')] } });

    await openAddMenu(user);

    expect(await screen.findByRole('menuitemcheckbox', { name: COLUMNS })).toHaveAttribute('aria-disabled', 'true');
    [FILTER, AGGREGATE, SORT].forEach((name) => expect(entry(name)).not.toHaveAttribute('aria-disabled', 'true'));

    await user.click(entry(COLUMNS));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(entry(COLUMNS)).toBeInTheDocument();
  });

  test('withholds Aggregate and Show columns in an aggregate query', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, AGGREGATE);
    await pick(user, dialog, /QueryBuilder.GroupBy/, 'activity_type');
    await apply(user, dialog);
    expect(await screen.findByRole('button', { name: /^QueryBuilder.Aggregate:/ })).toBeInTheDocument();

    await openAddMenu(user);

    expect(await screen.findByRole('menuitemcheckbox', { name: AGGREGATE })).toHaveAttribute('aria-disabled', 'true');
    expect(entry(COLUMNS)).toHaveAttribute('aria-disabled', 'true');
    [FILTER, SORT].forEach((name) => expect(entry(name)).not.toHaveAttribute('aria-disabled', 'true'));
  });

  test('returns from a popup to the menu with Back and opens another part from there', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, SORT);

    await user.click(within(dialog).getByRole('button', { name: 'Buttons.Back' }));

    await user.click(await screen.findByRole('menuitemcheckbox', { name: FILTER }));

    expect(await screen.findByRole('dialog', { name: 'QueryChips.AddFilter' })).toBeInTheDocument();
    expect(currentQuery().sort).toBeUndefined();
  });

  test('closes on Cancel without writing the part', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, FILTER);
    await pick(user, dialog, /QueryChips.Column/, 'activity_type');
    await pick(user, dialog, /QueryChips.Value/, 'coding');

    await user.click(within(dialog).getByRole('button', { name: 'Buttons.Cancel' }));

    await waitFor(() => expect(addButton()).toHaveAttribute('aria-expanded', 'false'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('button', { name: /activity_type/ })).toBeNull();
    expect(currentQuery().filter).toBeUndefined();
  });

  test('starts from the menu again after a popup was closed', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, SORT);
    await user.click(within(dialog).getByRole('button', { name: 'Buttons.Cancel' }));
    await waitFor(() => expect(addButton()).toHaveAttribute('aria-expanded', 'false'));

    await openAddMenu(user);

    expect(await screen.findByRole('menuitemcheckbox', { name: SORT })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
