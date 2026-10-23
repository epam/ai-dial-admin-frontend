import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useState } from 'react';

import RateLimitSchedule from '@/src/components/SystemProperties/RateLimitSchedule';
import { BasicI18nKey, SystemPropertiesI18nKey } from '@/src/constants/i18n';
import { ValidationActionType, useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { RateLimitSchedule as RateLimitScheduleModel, WeekDay } from '@/src/models/system-properties';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

// test-setup mocks the context with a single shared dispatch — grabbing it here lets the spec
// assert what the component reports for the save button.
const { dispatch } = useSaveValidationContext();

const SCHEDULE: RateLimitScheduleModel = {
  timezone: 'Europe/Warsaw',
  weekStartDay: WeekDay.Sun,
  resetTime: '09:30',
};

const renderRateLimitSchedule = (props?: {
  schedule?: RateLimitScheduleModel;
  onChangeRateLimitSchedule?: (schedule: RateLimitScheduleModel) => void;
}) =>
  render(
    <RateLimitSchedule
      schedule={props?.schedule}
      onChangeRateLimitSchedule={
        props?.onChangeRateLimitSchedule ?? vi.fn<(schedule: RateLimitScheduleModel) => void>()
      }
    />,
  );

// Free-text and search interactions need the schedule to live in state, the way SystemProperties
// holds it — a spy parent never re-renders, so a controlled input's typed value never sticks.
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

describe('RateLimitSchedule', () => {
  beforeEach(async () => {
    const { useIsReadOnlyAdmin } = await import('@/src/hooks/use-is-read-only-admin');
    vi.mocked(useIsReadOnlyAdmin).mockReturnValue(false);
    vi.mocked(dispatch).mockClear();
  });

  test('renders the timezone, week start day and reset time controls with their labels', () => {
    renderRateLimitSchedule({ schedule: SCHEDULE });

    expect(screen.getByRole('combobox', { name: SystemPropertiesI18nKey.TimezoneLabel })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: SystemPropertiesI18nKey.WeekStartDayLabel })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: SystemPropertiesI18nKey.ResetTimeLabel })).toBeTruthy();
    expect(screen.getByText(SystemPropertiesI18nKey.RateLimitScheduleDescription)).toBeTruthy();
  });

  test('reflects a stored schedule in the controls', () => {
    renderRateLimitSchedule({ schedule: SCHEDULE });

    expect(screen.getByRole('combobox', { name: SystemPropertiesI18nKey.TimezoneLabel })).toHaveDisplayValue(
      'Europe/Warsaw',
    );
    expect(screen.getByRole('combobox', { name: SystemPropertiesI18nKey.WeekStartDayLabel })).toHaveDisplayValue(
      SystemPropertiesI18nKey.WeekdaySunday,
    );
    expect(screen.getByRole('textbox', { name: SystemPropertiesI18nKey.ResetTimeLabel })).toHaveValue('09:30');
  });

  test('displays Core defaults for an absent schedule without writing them to state', () => {
    const onChangeRateLimitSchedule = vi.fn<(schedule: RateLimitScheduleModel) => void>();
    renderRateLimitSchedule({ onChangeRateLimitSchedule });

    expect(screen.getByRole('combobox', { name: SystemPropertiesI18nKey.TimezoneLabel })).toHaveDisplayValue('UTC');
    expect(screen.getByRole('combobox', { name: SystemPropertiesI18nKey.WeekStartDayLabel })).toHaveDisplayValue(
      SystemPropertiesI18nKey.WeekdayMonday,
    );
    expect(screen.getByRole('textbox', { name: SystemPropertiesI18nKey.ResetTimeLabel })).toHaveValue('00:00');
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

  test('materializes all three values on the first edit of an absent schedule', async () => {
    const user = userEvent.setup();
    const { getSchedule } = renderWithState();

    const resetTime = screen.getByRole('textbox', { name: SystemPropertiesI18nKey.ResetTimeLabel });
    await user.clear(resetTime);
    await user.type(resetTime, '09:30');

    expect(getSchedule()).toEqual({
      timezone: 'UTC',
      weekStartDay: WeekDay.Mon,
      resetTime: '09:30',
    });
  });

  test('shows the validation error for an invalid reset time and clears it once corrected', async () => {
    const user = userEvent.setup();
    renderWithState(SCHEDULE);

    const resetTime = screen.getByRole('textbox', { name: SystemPropertiesI18nKey.ResetTimeLabel });
    await user.clear(resetTime);
    await user.type(resetTime, '9:99');

    expect(screen.getByText(SystemPropertiesI18nKey.ResetTimeInvalid)).toBeTruthy();

    await user.clear(resetTime);
    await user.type(resetTime, '09:30');

    expect(screen.queryByText(SystemPropertiesI18nKey.ResetTimeInvalid)).toBeNull();
  });

  test('reports schedule validity through the save-validation context', async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithState(SCHEDULE);

    expect(dispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'rateLimitSchedule',
      isValid: true,
    });

    const resetTime = screen.getByRole('textbox', { name: SystemPropertiesI18nKey.ResetTimeLabel });
    await user.clear(resetTime);
    await user.type(resetTime, '9:99');

    expect(dispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'rateLimitSchedule',
      isValid: false,
    });

    await user.clear(resetTime);
    await user.type(resetTime, '09:30');

    expect(dispatch).toHaveBeenLastCalledWith({
      type: ValidationActionType.SetField,
      field: 'rateLimitSchedule',
      isValid: true,
    });

    unmount();

    expect(dispatch).toHaveBeenCalledWith({
      type: ValidationActionType.RemoveField,
      field: 'rateLimitSchedule',
    });
  });

  test('disables all three controls for a read-only admin', async () => {
    const user = userEvent.setup();
    const onChangeRateLimitSchedule = vi.fn<(schedule: RateLimitScheduleModel) => void>();
    const { useIsReadOnlyAdmin } = await import('@/src/hooks/use-is-read-only-admin');
    vi.mocked(useIsReadOnlyAdmin).mockReturnValue(true);
    renderRateLimitSchedule({ schedule: SCHEDULE, onChangeRateLimitSchedule });

    const timezone = screen.getByRole('combobox', { name: SystemPropertiesI18nKey.TimezoneLabel });
    const weekStartDay = screen.getByRole('combobox', { name: SystemPropertiesI18nKey.WeekStartDayLabel });
    const resetTime = screen.getByRole('textbox', { name: SystemPropertiesI18nKey.ResetTimeLabel });

    expect(timezone).toBeDisabled();
    expect(weekStartDay).toBeDisabled();
    expect(resetTime).toBeDisabled();

    await user.click(timezone);
    await user.click(weekStartDay);
    expect(onChangeRateLimitSchedule).not.toHaveBeenCalled();
  });
});
