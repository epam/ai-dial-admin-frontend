import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import {
  apply,
  applyButton,
  currentQuery,
  openAdd,
  openChip,
  renderChipBar,
} from '@/src/components/Analytics/QueryBuilder/Chips/tests/chip-bar.fixture';
import { createColumnRow } from '@/src/components/Analytics/QueryBuilder/utils/state';

const SHOW_COLUMNS = 'QueryChips.ShowColumns';
const COLUMNS_CHIP = /QueryChips.ShowColumns: QueryChips.ColumnsCount/;
const CHECKED = 'aria-checked';

const box = (dialog: HTMLElement, name: string) => within(dialog).getByRole('checkbox', { name });

const selectedNames = () => currentQuery().select?.map((column) => column.expr);

describe('ColumnsPanel', () => {
  test('lists the columns under All, their tag groups and the untagged rest, with nothing selected', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, SHOW_COLUMNS);

    expect(within(dialog).getByRole('heading', { name: SHOW_COLUMNS })).toBeInTheDocument();
    [
      'QueryChips.AllColumns',
      'identity',
      'insights',
      'created_at',
      'activity_type',
      'title',
      'is_resolved',
      'Cost',
    ].forEach((name) => expect(box(dialog, name)).toHaveAttribute(CHECKED, 'false'));
    expect(within(dialog).getAllByText('QueryChips.GroupSelected')).toHaveLength(2);
    expect(applyButton(dialog)).toBeDisabled();
    expect(within(dialog).queryByRole('button', { name: 'Buttons.Remove' })).toBeNull();
  });

  test('marks a group and All as mixed while only part of their columns is selected', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, SHOW_COLUMNS);

    await user.click(box(dialog, 'title'));

    expect(box(dialog, 'title')).toHaveAttribute(CHECKED, 'true');
    expect(box(dialog, 'insights')).toHaveAttribute(CHECKED, 'mixed');
    expect(box(dialog, 'identity')).toHaveAttribute(CHECKED, 'false');
    expect(box(dialog, 'QueryChips.AllColumns')).toHaveAttribute(CHECKED, 'mixed');
    expect(applyButton(dialog)).toBeEnabled();
  });

  test('selects and clears a whole group from its checkbox', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, SHOW_COLUMNS);

    await user.click(box(dialog, 'insights'));

    expect(box(dialog, 'insights')).toHaveAttribute(CHECKED, 'true');
    expect(box(dialog, 'activity_type')).toHaveAttribute(CHECKED, 'true');
    expect(box(dialog, 'title')).toHaveAttribute(CHECKED, 'true');
    expect(box(dialog, 'created_at')).toHaveAttribute(CHECKED, 'false');
    expect(box(dialog, 'QueryChips.AllColumns')).toHaveAttribute(CHECKED, 'mixed');

    await user.click(box(dialog, 'insights'));

    expect(box(dialog, 'insights')).toHaveAttribute(CHECKED, 'false');
    expect(box(dialog, 'title')).toHaveAttribute(CHECKED, 'false');
    expect(box(dialog, 'QueryChips.AllColumns')).toHaveAttribute(CHECKED, 'false');
    expect(applyButton(dialog)).toBeDisabled();
  });

  test('selects and clears every column from All', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, SHOW_COLUMNS);

    await user.click(box(dialog, 'QueryChips.AllColumns'));

    [
      'QueryChips.AllColumns',
      'identity',
      'insights',
      'created_at',
      'activity_type',
      'title',
      'is_resolved',
      'Cost',
    ].forEach((name) => expect(box(dialog, name)).toHaveAttribute(CHECKED, 'true'));

    await user.click(box(dialog, 'QueryChips.AllColumns'));

    expect(box(dialog, 'QueryChips.AllColumns')).toHaveAttribute(CHECKED, 'false');
    expect(box(dialog, 'Cost')).toHaveAttribute(CHECKED, 'false');
  });

  test('writes the selected columns in schema order whatever order they were ticked in', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, SHOW_COLUMNS);

    await user.click(box(dialog, 'Cost'));
    await user.click(box(dialog, 'title'));
    await user.click(box(dialog, 'created_at'));
    await apply(user, dialog);

    expect(await screen.findByRole('button', { name: COLUMNS_CHIP })).toBeInTheDocument();
    expect(selectedNames()).toEqual([
      { type: 'field', name: 'created_at' },
      { type: 'field', name: 'title' },
      { type: 'field', name: 'cost' },
    ]);
  });

  test('collapses and expands a tag group', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, SHOW_COLUMNS);
    const [identityToggle] = within(dialog).getAllByRole('button', { name: 'QueryChips.GroupColumns' });

    expect(identityToggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(identityToggle);

    expect(identityToggle).toHaveAttribute('aria-expanded', 'false');
    expect(within(dialog).queryByRole('checkbox', { name: 'created_at' })).toBeNull();
    expect(box(dialog, 'title')).toBeInTheDocument();

    await user.click(identityToggle);

    expect(identityToggle).toHaveAttribute('aria-expanded', 'true');
    expect(box(dialog, 'created_at')).toBeInTheDocument();
  });

  test('opens the chip with the current selection and rewrites it on Apply', async () => {
    const user = userEvent.setup();
    renderChipBar({ initial: { select: [createColumnRow('title'), createColumnRow('cost')] } });
    const dialog = await openChip(user, COLUMNS_CHIP);

    expect(within(dialog).getByRole('heading', { name: 'QueryChips.Columns' })).toBeInTheDocument();
    expect(box(dialog, 'title')).toHaveAttribute(CHECKED, 'true');
    expect(box(dialog, 'Cost')).toHaveAttribute(CHECKED, 'true');
    expect(box(dialog, 'activity_type')).toHaveAttribute(CHECKED, 'false');
    expect(within(dialog).queryByRole('button', { name: 'Buttons.Back' })).toBeNull();

    await user.click(box(dialog, 'Cost'));
    await user.click(box(dialog, 'activity_type'));
    await apply(user, dialog);

    expect(await screen.findByRole('button', { name: COLUMNS_CHIP })).toHaveAttribute('aria-expanded', 'false');
    expect(selectedNames()).toEqual([
      { type: 'field', name: 'activity_type' },
      { type: 'field', name: 'title' },
    ]);
  });

  test('returns to every column on Remove', async () => {
    const user = userEvent.setup();
    renderChipBar({ initial: { select: [createColumnRow('title')] } });
    const dialog = await openChip(user, COLUMNS_CHIP);

    await user.click(within(dialog).getByRole('button', { name: 'Buttons.Remove' }));

    expect(await screen.findByRole('button', { name: 'QueryChips.AddPart' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: COLUMNS_CHIP })).toBeNull();
    expect(currentQuery().select).toBeUndefined();
  });
});
