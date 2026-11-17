import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import {
  apply,
  applyButton,
  ChipUser,
  currentQuery,
  openChip,
  renderChipBar,
} from '@/src/components/Analytics/QueryBuilder/Chips/tests/chip-bar.fixture';
import { createInitialPage } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { QueryPageType } from '@/src/models/analytics/query';

const LIMIT_CHIP = /QueryBuilder.Limit/;

const fill = async (user: ChipUser, dialog: HTMLElement, name: string, value: string) => {
  const input = within(dialog).getByRole('spinbutton', { name });
  await user.clear(input);
  if (value) await user.type(input, value);
};

describe('LimitPanel', () => {
  test('opens with the current rows and offset, and offers neither Back nor Remove', async () => {
    const user = userEvent.setup();
    renderChipBar({ initial: { page: { ...createInitialPage(), limit: 40, offset: 80 } } });
    const dialog = await openChip(user, LIMIT_CHIP);

    expect(within(dialog).getByRole('heading', { name: 'QueryBuilder.Limit' })).toBeInTheDocument();
    expect(within(dialog).getByRole('spinbutton', { name: 'QueryChips.Rows' })).toHaveValue(40);
    expect(within(dialog).getByRole('spinbutton', { name: 'QueryBuilder.Offset' })).toHaveValue(80);
    expect(applyButton(dialog)).toBeEnabled();
    expect(within(dialog).queryByRole('button', { name: 'Buttons.Back' })).toBeNull();
    expect(within(dialog).queryByRole('button', { name: 'Buttons.Remove' })).toBeNull();
  });

  test('writes the rows and the offset as offset paging', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openChip(user, LIMIT_CHIP);

    await fill(user, dialog, 'QueryChips.Rows', '25');
    await fill(user, dialog, 'QueryBuilder.Offset', '50');
    await apply(user, dialog);

    expect(await screen.findByRole('button', { name: LIMIT_CHIP })).toHaveAttribute('aria-expanded', 'false');
    expect(currentQuery().page).toEqual({ type: 'offset', offset: 50, limit: 25, include_total: false });
  });

  test('switches cursor paging to offset paging on Apply', async () => {
    const user = userEvent.setup();
    renderChipBar({
      initial: { page: { ...createInitialPage(), type: QueryPageType.Cursor, cursor: 'abc', includeTotal: true } },
    });
    const dialog = await openChip(user, LIMIT_CHIP);

    await fill(user, dialog, 'QueryChips.Rows', '10');
    await apply(user, dialog);

    expect(await screen.findByRole('button', { name: LIMIT_CHIP })).toHaveAttribute('aria-expanded', 'false');
    expect(currentQuery().page).toEqual({ type: 'offset', offset: 0, limit: 10, include_total: false });
  });

  test.each([
    ['zero rows', 'QueryChips.Rows', '0'],
    ['no rows', 'QueryChips.Rows', ''],
    ['fractional rows', 'QueryChips.Rows', '1.5'],
    ['negative rows', 'QueryChips.Rows', '-5'],
    ['a negative offset', 'QueryBuilder.Offset', '-1'],
    ['no offset', 'QueryBuilder.Offset', ''],
    ['a fractional offset', 'QueryBuilder.Offset', '2.5'],
  ])('disables Apply for %s', async (_case, name, value) => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openChip(user, LIMIT_CHIP);

    await fill(user, dialog, name, value);

    expect(applyButton(dialog)).toBeDisabled();
  });

  test.each([
    ['one row', 'QueryChips.Rows', '1'],
    ['a zero offset', 'QueryBuilder.Offset', '0'],
  ])('keeps Apply enabled for %s', async (_case, name, value) => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openChip(user, LIMIT_CHIP);

    await fill(user, dialog, name, value);

    expect(applyButton(dialog)).toBeEnabled();
  });
});
