import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ComponentProps, useState } from 'react';

import RateLimitSchedule from '@/src/components/SystemProperties/RateLimitSchedule';
import { BasicI18nKey, SystemPropertiesI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { ValidationActionType, useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { RateLimitSchedule as RateLimitScheduleModel, WeekDay } from '@/src/models/system-properties';

const { dispatch } = useSaveValidationContext();

const SCHEDULE: RateLimitScheduleModel = {
  timezone: 'Europe/Warsaw',
  weekStartDay: WeekDay.Sun,
  resetTime: '09:30',
};

const renderRateLimitSchedule = (props?: Partial<ComponentProps<typeof RateLimitSchedule>>) =>
  render(
    <RateLimitSchedule
      schedule={props?.schedule}
      onChangeRateLimitSchedule={props?.onChangeRateLimitSchedule ?? vi.fn()}
    />,
  );

// Keep the schedule controlled as it is on the page, so Calendar sees committed selections and Discard values.
const renderWithState = (initial?: RateLimitScheduleModel) => {
  let latest: RateLimitScheduleModel | undefined = initial;
  const Host = () => {
    const [schedule, setSchedule] = useState<RateLimitScheduleModel | undefined>(initial);
    latest = schedule;
    return <RateLimitSchedule schedule={schedule} onChangeRateLimitSchedule={setSchedule} />;
  };
  const { unmount } = render(<Host />);
  return { getSchedule: () => latest, unmount };
};

const getResetTime = () => screen.getByRole('textbox', { name: SystemPropertiesI18nKey.ResetTimeLabel });

const selectTime = async (user: ReturnType<typeof userEvent.setup>, hours: string, minutes: string) => {
  await user.click(screen.getByRole('button', { name: 'Choose time' }));
  await user.click(within(screen.getByRole('listbox', { name: 'Hours' })).getByRole('option', { name: hours }));
  await user.click(within(screen.getByRole('listbox', { name: 'Minutes' })).getByRole('option', { name: minutes }));
};

describe('RateLimitSchedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppContext().isReadOnlyAdmin = false;
  });

  afterEach(() => {
    useAppContext().isReadOnlyAdmin = false;
  });

  test('renders the schedule controls with their labels and a time picker', () => {
    renderRateLimitSchedule({ schedule: SCHEDULE });

    expect(screen.getByRole('combobox', { name: SystemPropertiesI18nKey.TimezoneLabel })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: SystemPropertiesI18nKey.WeekStartDayLabel })).toBeTruthy();
    expect(getResetTime()).toHaveValue('09:30');
    expect(screen.getByRole('button', { name: 'Choose time' })).toBeTruthy();
    expect(screen.getByText(SystemPropertiesI18nKey.RateLimitScheduleDescription)).toBeTruthy();
    expect(dispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'rateLimitSchedule',
      isValid: true,
    });
  });

  test('reflects the stored timezone and week start day', () => {
    renderRateLimitSchedule({ schedule: SCHEDULE });

    expect(screen.getByRole('combobox', { name: SystemPropertiesI18nKey.TimezoneLabel })).toHaveDisplayValue(
      'Europe/Warsaw',
    );
    expect(screen.getByRole('combobox', { name: SystemPropertiesI18nKey.WeekStartDayLabel })).toHaveDisplayValue(
      SystemPropertiesI18nKey.WeekdaySunday,
    );
  });

  test('displays Core defaults without materializing them on focus or opening the picker', async () => {
    const user = userEvent.setup();
    const onChangeRateLimitSchedule = vi.fn();
    renderRateLimitSchedule({ onChangeRateLimitSchedule });

    expect(screen.getByRole('combobox', { name: SystemPropertiesI18nKey.TimezoneLabel })).toHaveDisplayValue('UTC');
    expect(screen.getByRole('combobox', { name: SystemPropertiesI18nKey.WeekStartDayLabel })).toHaveDisplayValue(
      SystemPropertiesI18nKey.WeekdayMonday,
    );
    expect(getResetTime()).toHaveValue('00:00');
    await user.click(getResetTime());
    await user.click(screen.getByRole('button', { name: 'Choose time' }));
    expect(screen.getByRole('dialog', { name: 'Choose time' })).toBeTruthy();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: 'Choose time' })).toBeNull();
    expect(onChangeRateLimitSchedule).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'rateLimitSchedule',
      isValid: true,
    });
  });

  test('filters the full IANA id list from the timezone search', async () => {
    const user = userEvent.setup();
    renderRateLimitSchedule({ schedule: SCHEDULE });

    await user.click(screen.getByRole('combobox', { name: SystemPropertiesI18nKey.TimezoneLabel }));
    await user.type(screen.getByPlaceholderText(BasicI18nKey.Search), 'Warsaw');

    expect(screen.getByRole('option', { name: 'Europe/Warsaw' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: 'America/New_York' })).toBeNull();
  });

  test('commits visual selections as canonical strings and closes after choosing minutes', async () => {
    const user = userEvent.setup();
    const onChangeRateLimitSchedule = vi.fn();
    renderRateLimitSchedule({ schedule: SCHEDULE, onChangeRateLimitSchedule });

    await user.click(screen.getByRole('button', { name: 'Choose time' }));
    await user.click(within(screen.getByRole('listbox', { name: 'Hours' })).getByRole('option', { name: '14' }));

    expect(onChangeRateLimitSchedule).toHaveBeenCalledWith({ ...SCHEDULE, resetTime: '14:30' });
    expect(getResetTime()).toHaveValue('14:30');
    expect(screen.getByRole('dialog', { name: 'Choose time' })).toBeTruthy();
    expect(within(screen.getByRole('listbox', { name: 'Hours' })).getByRole('option', { name: '14' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await user.click(within(screen.getByRole('listbox', { name: 'Minutes' })).getByRole('option', { name: '05' }));

    expect(onChangeRateLimitSchedule).toHaveBeenCalledWith({ ...SCHEDULE, resetTime: '14:05' });
    expect(getResetTime()).toHaveValue('14:05');
    expect(screen.queryByRole('dialog', { name: 'Choose time' })).toBeNull();
  });

  test.each([
    ['00', '00'],
    ['23', '59'],
  ])('allows the boundary time %s:%s without rounding', async (hours, minutes) => {
    const user = userEvent.setup();
    const { getSchedule } = renderWithState(SCHEDULE);

    await selectTime(user, hours, minutes);

    expect(getResetTime()).toHaveValue(`${hours}:${minutes}`);
    expect(getSchedule()).toEqual({ ...SCHEDULE, resetTime: `${hours}:${minutes}` });
  });

  test('allows keyboard selection through the labeled hours and minutes lists', async () => {
    const user = userEvent.setup();
    const { getSchedule } = renderWithState(SCHEDULE);

    await user.click(getResetTime());
    await user.tab();
    expect(screen.getByRole('button', { name: 'Choose time' })).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.tab();
    expect(within(screen.getByRole('listbox', { name: 'Hours' })).getByRole('option', { name: '09' })).toHaveFocus();
    await user.keyboard('{ArrowDown}{Enter}');
    await user.tab();
    expect(within(screen.getByRole('listbox', { name: 'Minutes' })).getByRole('option', { name: '30' })).toHaveFocus();
    await user.keyboard('{ArrowDown}{Enter}');

    expect(getResetTime()).toHaveValue('10:31');
    expect(getSchedule()).toEqual({ ...SCHEDULE, resetTime: '10:31' });
    expect(screen.queryByRole('dialog', { name: 'Choose time' })).toBeNull();
  });

  test('materializes all three default values on the first time selection', async () => {
    const user = userEvent.setup();
    const { getSchedule } = renderWithState();

    await selectTime(user, '09', '30');

    expect(getSchedule()).toEqual({ timezone: 'UTC', weekStartDay: WeekDay.Mon, resetTime: '09:30' });
  });

  test('normalizes complete typed digits and materializes the schedule', async () => {
    const user = userEvent.setup();
    const { getSchedule } = renderWithState();

    await user.clear(getResetTime());
    await user.type(getResetTime(), '0930');

    expect(getResetTime()).toHaveValue('09:30');
    expect(getSchedule()).toEqual({ timezone: 'UTC', weekStartDay: WeekDay.Mon, resetTime: '09:30' });
  });

  test.each(['', '09'])(
    'validates the incomplete draft "%s" on blur and clears the error after correction',
    async (draft) => {
      const user = userEvent.setup();
      const { getSchedule, unmount } = renderWithState(SCHEDULE);

      await user.clear(getResetTime());
      if (draft) {
        await user.type(getResetTime(), draft);
      }
      await user.tab();

      expect(getSchedule()).toEqual({ ...SCHEDULE, resetTime: draft });
      expect(screen.getByRole('alert')).toHaveTextContent(SystemPropertiesI18nKey.ResetTimeInvalid);
      expect(dispatch).toHaveBeenCalledWith({
        type: ValidationActionType.SetField,
        field: 'rateLimitSchedule',
        isValid: false,
      });

      await user.clear(getResetTime());
      await user.type(getResetTime(), '0930');

      expect(getResetTime()).toHaveValue('09:30');
      expect(screen.queryByRole('alert')).toBeNull();
      expect(dispatch).toHaveBeenCalledWith({
        type: ValidationActionType.SetField,
        field: 'rateLimitSchedule',
        isValid: true,
      });

      unmount();
      expect(dispatch).toHaveBeenCalledWith({ type: ValidationActionType.RemoveField, field: 'rateLimitSchedule' });
    },
  );

  test('keeps a malformed stored time invalid until both segments are corrected', async () => {
    const user = userEvent.setup();
    renderWithState({ ...SCHEDULE, resetTime: '25:99' });

    expect(getResetTime()).toHaveValue('25:99');
    expect(screen.getByRole('alert')).toHaveTextContent(SystemPropertiesI18nKey.ResetTimeInvalid);
    await user.click(screen.getByRole('button', { name: 'Choose time' }));
    await user.click(within(screen.getByRole('listbox', { name: 'Hours' })).getByRole('option', { name: '09' }));

    expect(getResetTime()).toHaveValue('09:99');
    expect(screen.getByRole('alert')).toBeTruthy();
    await user.click(within(screen.getByRole('listbox', { name: 'Minutes' })).getByRole('option', { name: '30' }));

    expect(getResetTime()).toHaveValue('09:30');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  test('disables all schedule controls and the time picker for a read-only admin', async () => {
    const user = userEvent.setup();
    const onChangeRateLimitSchedule = vi.fn();
    useAppContext().isReadOnlyAdmin = true;
    renderRateLimitSchedule({ schedule: SCHEDULE, onChangeRateLimitSchedule });

    const timezone = screen.getByRole('combobox', { name: SystemPropertiesI18nKey.TimezoneLabel });
    const weekStartDay = screen.getByRole('combobox', { name: SystemPropertiesI18nKey.WeekStartDayLabel });
    const clock = screen.getByRole('button', { name: 'Choose time' });

    expect(timezone).toBeDisabled();
    expect(weekStartDay).toBeDisabled();
    expect(getResetTime()).toBeDisabled();
    expect(clock).toBeDisabled();
    await user.click(clock);
    await user.type(getResetTime(), '1230');

    expect(screen.queryByRole('dialog', { name: 'Choose time' })).toBeNull();
    expect(onChangeRateLimitSchedule).not.toHaveBeenCalled();
  });
});
