import { fireEvent, screen, within } from '@testing-library/react';
import { toDateText } from '@/src/components/Analytics/QueryBuilder/Chips/utils/period';
import { timePeriodOptionsConfig } from '@/src/constants/global-time-filter';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { PeriodControl } from '@/src/components/Analytics/QueryBuilder/Chips/models';
import {
  apply,
  applyButton,
  openChip,
  renderChipBar,
} from '@/src/components/Analytics/QueryBuilder/Chips/tests/chip-bar.fixture';

const PERIOD_CHIP = /^QueryChips\.Period:/;

const createPeriod = (overrides: Partial<PeriodControl> = {}): PeriodControl => ({
  timePeriod: '2d',
  isCustom: false,
  timeRange: { startDate: new Date(2026, 6, 1), endDate: new Date(2026, 6, 3, 23, 59, 59, 999) },
  onChangeTimePeriod: vi.fn(),
  onChangeTimeRange: vi.fn(),
  ...overrides,
});

const PRESET_IDS = timePeriodOptionsConfig.map((option) => option.value);

const preset = (dialog: HTMLElement, id: string) =>
  within(within(dialog).getByRole('list')).getAllByRole('button')[PRESET_IDS.indexOf(id)];

const typeDate = (dialog: HTMLElement, name: RegExp, value: string) =>
  fireEvent.change(within(dialog).getByRole('textbox', { name }), { target: { value } });

describe('PeriodPanel', () => {
  test('marks the current preset as pressed', async () => {
    const user = userEvent.setup();
    renderChipBar({ period: createPeriod() });
    const dialog = await openChip(user, PERIOD_CHIP);

    expect(within(dialog).getByRole('heading', { name: 'QueryChips.Period' })).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: 'QueryChips.PeriodPresets' })).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: 'QueryChips.PeriodCustomRange' })).toBeInTheDocument();
    expect(preset(dialog, '2d')).toHaveAttribute('aria-pressed', 'true');
    expect(preset(dialog, '7d')).toHaveAttribute('aria-pressed', 'false');
    expect(applyButton(dialog)).toBeEnabled();
  });

  test('reports a chosen preset on Apply', async () => {
    const user = userEvent.setup();
    const period = createPeriod();
    renderChipBar({ period });
    const dialog = await openChip(user, PERIOD_CHIP);

    await user.click(preset(dialog, '7d'));
    expect(preset(dialog, '7d')).toHaveAttribute('aria-pressed', 'true');
    expect(preset(dialog, '2d')).toHaveAttribute('aria-pressed', 'false');
    expect(period.onChangeTimePeriod).not.toHaveBeenCalled();

    await apply(user, dialog);

    expect(await screen.findByRole('button', { name: PERIOD_CHIP })).toHaveAttribute('aria-expanded', 'false');
    expect(period.onChangeTimePeriod).toHaveBeenCalledExactlyOnceWith('7d');
    expect(period.onChangeTimeRange).not.toHaveBeenCalled();
  });

  test('reports a custom range picked in the calendar on Apply', async () => {
    const user = userEvent.setup();
    const period = createPeriod();
    const today = new Date();
    renderChipBar({ period });
    const dialog = await openChip(user, PERIOD_CHIP);

    await user.click(within(dialog).getByRole('button', { name: 'previous-month' }));
    await user.click(within(dialog).getByRole('gridcell', { name: /^Choose .* 10th, / }));
    await user.click(within(dialog).getByRole('gridcell', { name: /^Choose .* 12th, / }));

    expect(preset(dialog, '2d')).toHaveAttribute('aria-pressed', 'false');
    expect(period.onChangeTimeRange).not.toHaveBeenCalled();

    await apply(user, dialog);

    expect(await screen.findByRole('button', { name: PERIOD_CHIP })).toHaveAttribute('aria-expanded', 'false');
    expect(period.onChangeTimeRange).toHaveBeenCalledExactlyOnceWith(
      {
        startDate: new Date(today.getFullYear(), today.getMonth() - 1, 10),
        endDate: new Date(today.getFullYear(), today.getMonth() - 1, 12, 23, 59, 59, 999),
      },
      true,
    );
    expect(period.onChangeTimePeriod).not.toHaveBeenCalled();
  });

  test('opens a custom period with no preset pressed and reapplies its range', async () => {
    const user = userEvent.setup();
    const period = createPeriod({ isCustom: true });
    renderChipBar({ period });
    const dialog = await openChip(user, PERIOD_CHIP);

    expect(preset(dialog, '2d')).toHaveAttribute('aria-pressed', 'false');

    await apply(user, dialog);

    expect(await screen.findByRole('button', { name: PERIOD_CHIP })).toHaveAttribute('aria-expanded', 'false');
    expect(period.onChangeTimeRange).toHaveBeenCalledExactlyOnceWith(period.timeRange, true);
    expect(period.onChangeTimePeriod).not.toHaveBeenCalled();
  });

  test('replaces a custom period with a preset', async () => {
    const user = userEvent.setup();
    const period = createPeriod({ isCustom: true });
    renderChipBar({ period });
    const dialog = await openChip(user, PERIOD_CHIP);

    await user.click(preset(dialog, '1h'));
    await apply(user, dialog);

    expect(await screen.findByRole('button', { name: PERIOD_CHIP })).toHaveAttribute('aria-expanded', 'false');
    expect(period.onChangeTimePeriod).toHaveBeenCalledExactlyOnceWith('1h');
    expect(period.onChangeTimeRange).not.toHaveBeenCalled();
  });

  test('reports a range typed into the Start and End fields on Apply', async () => {
    const user = userEvent.setup();
    const period = createPeriod();
    renderChipBar({ period });
    const dialog = await openChip(user, PERIOD_CHIP);

    typeDate(dialog, /QueryChips.PeriodStart/, '2026-01-05');
    expect(within(dialog).getByRole('button', { name: 'Buttons.Apply' })).toBeDisabled();

    typeDate(dialog, /QueryChips.PeriodEnd/, '2026-01-07');
    await apply(user, dialog);

    expect(await screen.findByRole('button', { name: PERIOD_CHIP })).toHaveAttribute('aria-expanded', 'false');
    expect(period.onChangeTimeRange).toHaveBeenCalledExactlyOnceWith(
      { startDate: new Date(2026, 0, 5), endDate: new Date(2026, 0, 7, 23, 59, 59, 999) },
      true,
    );
  });

  test('keeps Apply unavailable while the typed end precedes the start', async () => {
    const user = userEvent.setup();
    renderChipBar({ period: createPeriod() });
    const dialog = await openChip(user, PERIOD_CHIP);

    typeDate(dialog, /QueryChips.PeriodStart/, '2026-01-07');
    typeDate(dialog, /QueryChips.PeriodEnd/, '2026-01-05');

    expect(within(dialog).getByRole('button', { name: 'Buttons.Apply' })).toBeDisabled();
  });

  test('writes a range picked in the calendar into the Start and End fields', async () => {
    const user = userEvent.setup();
    const today = new Date();
    renderChipBar({ period: createPeriod() });
    const dialog = await openChip(user, PERIOD_CHIP);

    await user.click(within(dialog).getByRole('button', { name: 'previous-month' }));
    await user.click(within(dialog).getByRole('gridcell', { name: /^Choose .* 10th, / }));
    await user.click(within(dialog).getByRole('gridcell', { name: /^Choose .* 12th, / }));

    expect(within(dialog).getByRole('textbox', { name: /QueryChips.PeriodStart/ })).toHaveValue(
      toDateText(new Date(today.getFullYear(), today.getMonth() - 1, 10)),
    );
    expect(within(dialog).getByRole('textbox', { name: /QueryChips.PeriodEnd/ })).toHaveValue(
      toDateText(new Date(today.getFullYear(), today.getMonth() - 1, 12)),
    );
  });

  test('reports nothing on Cancel', async () => {
    const user = userEvent.setup();
    const period = createPeriod();
    renderChipBar({ period });
    const dialog = await openChip(user, PERIOD_CHIP);

    await user.click(preset(dialog, '7d'));
    await user.click(within(dialog).getByRole('button', { name: 'Buttons.Cancel' }));

    expect(await screen.findByRole('button', { name: PERIOD_CHIP })).toHaveAttribute('aria-expanded', 'false');
    expect(period.onChangeTimePeriod).not.toHaveBeenCalled();
    expect(period.onChangeTimeRange).not.toHaveBeenCalled();
  });
});
