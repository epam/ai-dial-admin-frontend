import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { updateProperties } from '@/src/app/[lang]/system-properties/actions';
import SystemProperties from '@/src/components/SystemProperties/SystemProperties';
import {
  ButtonsI18nKey,
  EntitiesI18nKey,
  ErrorI18nKey,
  SystemPropertiesI18nKey,
  TabsI18nKey,
  UpdateI18nKey,
} from '@/src/constants/i18n';
import { SaveValidationContextProvider, ValidationActionType } from '@/src/context/SaveValidationContext';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import {
  GlobalSettings,
  RateLimitSchedule,
  SpendingLimitMode,
  SpendingLimits,
  WeekDay,
} from '@/src/models/system-properties';

const routerRefresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: routerRefresh }) }));

const showNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification, removeNotification: vi.fn() }),
}));

vi.mock('@/src/app/[lang]/system-properties/actions');

// Integration cases use the real validation hook and provider.
const validationContext = vi.hoisted(() => ({
  isValid: true,
  isUsingRealSchedule: false,
  isUsingRealSpendingLimits: false,
  dispatch: vi.fn(),
  jsonErrors: [] as unknown[],
  jsonErrorNotifications: [] as unknown[],
  resetCounter: 0,
  errorFields: new Map<string, boolean>(),
}));
vi.mock('@/src/context/SaveValidationContext', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/src/context/SaveValidationContext')>();
  return {
    ...original,
    useSaveValidationContext: () =>
      validationContext.isUsingRealSchedule || validationContext.isUsingRealSpendingLimits
        ? original.useSaveValidationContext()
        : validationContext,
  };
});

// AG Grid is heavy and not meaningful in jsdom — stand in with a button that fires the same
// onChangeInterceptors contract the real grid's drag/add/remove handlers all funnel into.
vi.mock('@/src/components/EntityView/Interceptors/GlobalInterceptors', () => ({
  default: ({ onChangeInterceptors }: { onChangeInterceptors: (interceptors: string[]) => void }) => (
    <button onClick={() => onChangeInterceptors(['new-interceptor'])}>change-interceptors</button>
  ),
}));

// Same stand-in idea as the interceptors mock: a button fires the onChangeRateLimitSchedule contract,
// and the read-back span mirrors the schedule the page passes down, so discard is observable.
const VALID_SCHEDULE: RateLimitSchedule = {
  timezone: 'Europe/Warsaw',
  weekStartDay: WeekDay.Sun,
  resetTime: '09:30',
};
vi.mock('@/src/components/SystemProperties/RateLimitSchedule', async (importOriginal) => {
  const { default: RealRateLimitSchedule } =
    await importOriginal<typeof import('@/src/components/SystemProperties/RateLimitSchedule')>();
  return {
    default: ({
      schedule,
      onChangeRateLimitSchedule,
    }: {
      schedule?: RateLimitSchedule;
      onChangeRateLimitSchedule: (schedule: RateLimitSchedule) => void;
    }) => {
      if (validationContext.isUsingRealSchedule) {
        return <RealRateLimitSchedule schedule={schedule} onChangeRateLimitSchedule={onChangeRateLimitSchedule} />;
      }
      return (
        <div>
          <span>schedule-timezone:{schedule?.timezone ?? 'absent'}</span>
          <button onClick={() => onChangeRateLimitSchedule(VALID_SCHEDULE)}>change-schedule</button>
        </div>
      );
    },
  };
});

// Same stand-in idea: a button fires the onChangeSpendingLimits contract and the read-back span mirrors
// the value the page passes down, so absence, round-trip and discard are observable.
const VALID_SPENDING_LIMITS: SpendingLimits = { mode: SpendingLimitMode.Enforce, defaultCostObject: 'TEAM-A' };
vi.mock('@/src/components/SystemProperties/SpendingLimits', async (importOriginal) => {
  const { default: RealSpendingLimits } =
    await importOriginal<typeof import('@/src/components/SystemProperties/SpendingLimits')>();
  return {
    default: ({
      spendingLimits,
      onChangeSpendingLimits,
    }: {
      spendingLimits?: SpendingLimits;
      onChangeSpendingLimits: (spendingLimits: SpendingLimits) => void;
    }) => {
      if (validationContext.isUsingRealSpendingLimits) {
        return <RealSpendingLimits spendingLimits={spendingLimits} onChangeSpendingLimits={onChangeSpendingLimits} />;
      }
      return (
        <div>
          <span>spending-mode:{spendingLimits?.mode ?? 'absent'}</span>
          <button onClick={() => onChangeSpendingLimits(VALID_SPENDING_LIMITS)}>change-spending-limits</button>
        </div>
      );
    },
  };
});

const INTERCEPTORS_MOCK: DialInterceptor[] = [];

const renderSystemProperties = (props?: {
  globalSettings?: GlobalSettings | null;
  doesSettingsExist?: boolean;
  optionWarnings?: EntitiesI18nKey[];
}) =>
  render(
    <SaveValidationContextProvider>
      <SystemProperties
        interceptors={INTERCEPTORS_MOCK}
        globalSettings={props?.globalSettings ?? null}
        doesSettingsExist={props?.doesSettingsExist ?? false}
        optionWarnings={props?.optionWarnings}
      />
    </SaveValidationContextProvider>,
  );

const openRateLimitScheduleTab = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByText(TabsI18nKey.RateLimitSchedule));
};

const openSpendingLimitsTab = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByText(TabsI18nKey.SpendingLimits));
};

describe('SystemProperties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validationContext.isValid = true;
    validationContext.isUsingRealSchedule = false;
    validationContext.isUsingRealSpendingLimits = false;
  });

  test('saves with an undefined etag when no settings blob exists yet', async () => {
    const user = userEvent.setup();
    (updateProperties as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
    renderSystemProperties({ doesSettingsExist: false, globalSettings: { globalInterceptors: [] } });

    await user.click(screen.getByText('change-interceptors'));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    expect(updateProperties).toHaveBeenCalledOnce();
    expect(updateProperties).toHaveBeenCalledWith({ globalInterceptors: ['new-interceptor'] }, undefined);
  });

  test('saves with If-Match: * (via DEFAULT_ETAG) when a settings blob already exists', async () => {
    const user = userEvent.setup();
    (updateProperties as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
    renderSystemProperties({
      doesSettingsExist: true,
      globalSettings: { globalInterceptors: [], retriableErrorCodes: [500] },
    });

    await user.click(screen.getByText('change-interceptors'));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    expect(updateProperties).toHaveBeenCalledWith(
      { globalInterceptors: ['new-interceptor'], retriableErrorCodes: [500] },
      '*',
    );
  });

  test('refreshes the page on a successful save', async () => {
    const user = userEvent.setup();
    (updateProperties as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
    renderSystemProperties({ doesSettingsExist: true, globalSettings: { globalInterceptors: [] } });

    await user.click(screen.getByText('change-interceptors'));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    expect(routerRefresh).toHaveBeenCalledOnce();
  });

  test('shows an error notification and does not refresh when the save fails', async () => {
    const user = userEvent.setup();
    (updateProperties as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      errorHeader: 'Precondition Failed',
      errorMessage: 'Resource must exist',
    });
    renderSystemProperties({ doesSettingsExist: true, globalSettings: { globalInterceptors: [] } });

    await user.click(screen.getByText('change-interceptors'));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    expect(showNotification).toHaveBeenCalledOnce();
    expect(routerRefresh).not.toHaveBeenCalled();
  });

  test('shows a generic error and keeps edits when the update rejects', async () => {
    const user = userEvent.setup();
    vi.mocked(updateProperties).mockRejectedValueOnce(new Error('Network failure'));
    renderSystemProperties({ globalSettings: { globalInterceptors: [] } });

    await user.click(screen.getByRole('button', { name: 'change-interceptors' }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: ErrorI18nKey.Error, description: ErrorI18nKey.TryAgainLater }),
    );
    expect(routerRefresh).not.toHaveBeenCalled();
    expect(validationContext.dispatch).not.toHaveBeenCalledWith({ type: ValidationActionType.Reset });
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeEnabled();
  });

  test('shows a warning notification for each option-read warning passed in', () => {
    renderSystemProperties({ optionWarnings: [EntitiesI18nKey.SystemPropertiesReadFailed] });

    expect(showNotification).toHaveBeenCalledOnce();
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: EntitiesI18nKey.IncompleteOptionList,
        description: EntitiesI18nKey.SystemPropertiesReadFailed,
      }),
    );
  });

  test('shows no unsaved-changes state for an absent schedule on the Rate Limit Schedule tab', async () => {
    const user = userEvent.setup();
    renderSystemProperties({ globalSettings: { globalInterceptors: [] } });

    await openRateLimitScheduleTab(user);

    expect(screen.getByText('schedule-timezone:absent')).toBeTruthy();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();
  });

  test('saves a schedule change explicitly while keeping the other settings intact', async () => {
    const user = userEvent.setup();
    (updateProperties as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
    renderSystemProperties({
      doesSettingsExist: true,
      globalSettings: { globalInterceptors: [], retriableErrorCodes: [500] },
    });

    await openRateLimitScheduleTab(user);
    await user.click(screen.getByText('change-schedule'));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    expect(updateProperties).toHaveBeenCalledWith(
      { globalInterceptors: [], retriableErrorCodes: [500], rateLimitSchedule: VALID_SCHEDULE },
      '*',
    );
  });

  test('disables Save while the save-validation context reports the tab invalid', async () => {
    const user = userEvent.setup();
    renderSystemProperties({ globalSettings: { globalInterceptors: [] } });

    await openRateLimitScheduleTab(user);
    validationContext.isValid = false;
    await user.click(screen.getByText('change-schedule'));

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();

    validationContext.isValid = true;
    await user.click(screen.getByText('change-schedule'));

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeEnabled();
  });

  test('resets the save-validation state after a successful save', async () => {
    const user = userEvent.setup();
    (updateProperties as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
    renderSystemProperties({ doesSettingsExist: true, globalSettings: { globalInterceptors: [] } });

    await user.click(screen.getByText('change-interceptors'));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    expect(validationContext.dispatch).toHaveBeenCalledWith({ type: ValidationActionType.Reset });
  });

  test('discard restores the schedule from the last read', async () => {
    const user = userEvent.setup();
    renderSystemProperties({
      globalSettings: {
        globalInterceptors: [],
        rateLimitSchedule: { timezone: 'America/New_York', weekStartDay: WeekDay.Sat, resetTime: '12:00' },
      },
    });

    await openRateLimitScheduleTab(user);
    await user.click(screen.getByText('change-schedule'));
    expect(screen.getByText('schedule-timezone:Europe/Warsaw')).toBeTruthy();

    // Opening the discard popup makes the page inert, so the second click lands on the popup's own
    // confirm button — the only accessible button still carrying the Discard name.
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Discard }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Discard }));

    expect(screen.getByText('schedule-timezone:America/New_York')).toBeTruthy();
  });

  test('saves the visually selected time with other settings and the existing success notification', async () => {
    const user = userEvent.setup();
    validationContext.isUsingRealSchedule = true;
    vi.mocked(updateProperties).mockResolvedValue({ success: true });
    renderSystemProperties({
      doesSettingsExist: true,
      globalSettings: {
        globalInterceptors: ['existing-interceptor'],
        retriableErrorCodes: [500],
        rateLimitSchedule: VALID_SCHEDULE,
      },
    });

    await openRateLimitScheduleTab(user);
    await user.click(screen.getByRole('button', { name: 'Choose time' }));
    await user.click(within(screen.getByRole('listbox', { name: 'Hours' })).getByRole('option', { name: '14' }));
    await user.click(within(screen.getByRole('listbox', { name: 'Minutes' })).getByRole('option', { name: '05' }));
    expect(screen.getByRole('textbox', { name: SystemPropertiesI18nKey.ResetTimeLabel })).toHaveValue('14:05');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    expect(updateProperties).toHaveBeenCalledWith(
      {
        globalInterceptors: ['existing-interceptor'],
        retriableErrorCodes: [500],
        rateLimitSchedule: { ...VALID_SCHEDULE, resetTime: '14:05' },
      },
      '*',
    );
    expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ title: UpdateI18nKey.NotificationTitle }));
    expect(routerRefresh).toHaveBeenCalledOnce();
  });

  test('restores the stored time after discarding a visual selection', async () => {
    const user = userEvent.setup();
    validationContext.isUsingRealSchedule = true;
    renderSystemProperties({ globalSettings: { globalInterceptors: [], rateLimitSchedule: VALID_SCHEDULE } });

    await openRateLimitScheduleTab(user);
    await user.click(screen.getByRole('button', { name: 'Choose time' }));
    await user.click(within(screen.getByRole('listbox', { name: 'Minutes' })).getByRole('option', { name: '05' }));
    expect(screen.getByRole('textbox', { name: SystemPropertiesI18nKey.ResetTimeLabel })).toHaveValue('09:05');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Discard }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Discard }));

    expect(screen.getByRole('textbox', { name: SystemPropertiesI18nKey.ResetTimeLabel })).toHaveValue('09:30');
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();
    expect(updateProperties).not.toHaveBeenCalled();
  });

  test.each(['', '09'])('blocks Save when the focused time field contains the incomplete draft "%s"', async (draft) => {
    const user = userEvent.setup();
    validationContext.isUsingRealSchedule = true;
    renderSystemProperties({ globalSettings: { globalInterceptors: [], rateLimitSchedule: VALID_SCHEDULE } });

    await user.click(screen.getByRole('button', { name: 'change-interceptors' }));
    await openRateLimitScheduleTab(user);
    const save = screen.getByRole('button', { name: ButtonsI18nKey.Save });
    expect(save).toBeEnabled();
    const resetTime = screen.getByRole('textbox', { name: SystemPropertiesI18nKey.ResetTimeLabel });
    await user.clear(resetTime);
    if (draft) {
      await user.type(resetTime, draft);
    }
    expect(resetTime).toHaveFocus();
    await user.click(save);

    expect(screen.getByRole('alert')).toHaveTextContent(SystemPropertiesI18nKey.ResetTimeInvalid);
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
    expect(updateProperties).not.toHaveBeenCalled();
    expect(showNotification).not.toHaveBeenCalled();
  });

  test.each([
    { ...VALID_SCHEDULE, timezone: 'Invalid/Timezone' },
    { ...VALID_SCHEDULE, weekStartDay: 'Invalid' as WeekDay },
    { ...VALID_SCHEDULE, resetTime: '25:00' },
  ])('blocks Save for an invalid stored schedule before opening its tab: %j', async (schedule) => {
    const user = userEvent.setup();
    validationContext.isUsingRealSchedule = true;
    renderSystemProperties({ globalSettings: { globalInterceptors: [], rateLimitSchedule: schedule } });

    await user.click(screen.getByRole('button', { name: 'change-interceptors' }));
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
    expect(updateProperties).not.toHaveBeenCalled();
  });

  test('keeps an invalid schedule registered across tabs and clears it on discard', async () => {
    const user = userEvent.setup();
    validationContext.isUsingRealSchedule = true;
    renderSystemProperties({ globalSettings: { globalInterceptors: [], rateLimitSchedule: VALID_SCHEDULE } });

    await openRateLimitScheduleTab(user);
    await user.clear(screen.getByRole('textbox', { name: SystemPropertiesI18nKey.ResetTimeLabel }));
    await user.click(screen.getByText(TabsI18nKey.GlobalInterceptors));
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
    const scheduleTab = screen.getByRole('tab', { name: new RegExp(TabsI18nKey.RateLimitSchedule) });
    expect(scheduleTab).toHaveAccessibleName(`${TabsI18nKey.RateLimitSchedule}: ${TabsI18nKey.StatusError}`);
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Discard }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Discard }));
    expect(scheduleTab).toHaveAccessibleName(TabsI18nKey.RateLimitSchedule);
    await user.click(screen.getByRole('button', { name: 'change-interceptors' }));
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeEnabled();
    expect(updateProperties).not.toHaveBeenCalled();
  });

  test('re-enables Save after correcting an invalid schedule on its tab', async () => {
    const user = userEvent.setup();
    validationContext.isUsingRealSchedule = true;
    renderSystemProperties({
      globalSettings: { globalInterceptors: [], rateLimitSchedule: { ...VALID_SCHEDULE, resetTime: '25:00' } },
    });

    await user.click(screen.getByRole('button', { name: 'change-interceptors' }));
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
    await openRateLimitScheduleTab(user);
    const resetTime = screen.getByRole('textbox', { name: SystemPropertiesI18nKey.ResetTimeLabel });
    await user.clear(resetTime);
    await user.type(resetTime, '0930');
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeEnabled();
    expect(screen.getByRole('tab', { name: TabsI18nKey.RateLimitSchedule })).toBeTruthy();
  });

  test('keeps an invalid schedule registered after an earlier save resets validation', async () => {
    const user = userEvent.setup();
    validationContext.isUsingRealSchedule = true;
    let resolveSave!: (result: Awaited<ReturnType<typeof updateProperties>>) => void;
    vi.mocked(updateProperties).mockReturnValueOnce(new Promise((resolve) => (resolveSave = resolve)));
    renderSystemProperties({ globalSettings: { globalInterceptors: [], rateLimitSchedule: VALID_SCHEDULE } });

    await user.click(screen.getByRole('button', { name: 'change-interceptors' }));
    await openRateLimitScheduleTab(user);
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));
    await user.clear(screen.getByRole('textbox', { name: SystemPropertiesI18nKey.ResetTimeLabel }));
    await user.click(screen.getByText(TabsI18nKey.GlobalInterceptors));
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
    await act(async () => resolveSave({ success: true }));
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
    expect(updateProperties).toHaveBeenCalledOnce();
  });

  test('shows no unsaved-changes state for absent spending limits on the Spending Limits tab', async () => {
    const user = userEvent.setup();
    renderSystemProperties({ globalSettings: { globalInterceptors: [] } });

    await openSpendingLimitsTab(user);

    expect(screen.getByText('spending-mode:absent')).toBeTruthy();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();
  });

  test('saves a spending-limits change while keeping the other settings intact', async () => {
    const user = userEvent.setup();
    (updateProperties as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
    renderSystemProperties({
      doesSettingsExist: true,
      globalSettings: { globalInterceptors: [], retriableErrorCodes: [500], rateLimitSchedule: VALID_SCHEDULE },
    });

    await openSpendingLimitsTab(user);
    await user.click(screen.getByText('change-spending-limits'));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    expect(updateProperties).toHaveBeenCalledWith(
      {
        globalInterceptors: [],
        retriableErrorCodes: [500],
        rateLimitSchedule: VALID_SCHEDULE,
        spendingLimits: VALID_SPENDING_LIMITS,
      },
      '*',
    );
  });

  test('creates the settings object when spending limits are the first edit and no blob exists', async () => {
    const user = userEvent.setup();
    (updateProperties as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
    renderSystemProperties({ doesSettingsExist: false, globalSettings: null });

    await openSpendingLimitsTab(user);
    await user.click(screen.getByText('change-spending-limits'));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    expect(updateProperties).toHaveBeenCalledWith(
      { globalInterceptors: [], spendingLimits: VALID_SPENDING_LIMITS },
      undefined,
    );
  });

  test('preserves existing spending limits when only the interceptors are saved', async () => {
    const user = userEvent.setup();
    (updateProperties as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
    const stored: SpendingLimits = { mode: SpendingLimitMode.Shadow, defaultCostObject: 'ORG' };
    renderSystemProperties({
      doesSettingsExist: true,
      globalSettings: { globalInterceptors: [], spendingLimits: stored },
    });

    await user.click(screen.getByText('change-interceptors'));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    expect(updateProperties).toHaveBeenCalledWith(
      { globalInterceptors: ['new-interceptor'], spendingLimits: stored },
      '*',
    );
  });

  test('discard restores the spending limits from the last read', async () => {
    const user = userEvent.setup();
    renderSystemProperties({
      globalSettings: {
        globalInterceptors: [],
        spendingLimits: { mode: SpendingLimitMode.Off, defaultCostObject: 'ORG' },
      },
    });

    await openSpendingLimitsTab(user);
    await user.click(screen.getByText('change-spending-limits'));
    expect(screen.getByText('spending-mode:enforce')).toBeTruthy();

    // The discard popup makes the page inert, so the second click lands on its own confirm button.
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Discard }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Discard }));

    expect(screen.getByText('spending-mode:off')).toBeTruthy();
  });

  test.each([
    ['', TabsI18nKey.GlobalInterceptors],
    ['   ', TabsI18nKey.GlobalInterceptors],
    ['', TabsI18nKey.RateLimitSchedule],
    ['   ', TabsI18nKey.RateLimitSchedule],
  ])('keeps Save disabled for cost object "%s" after switching to %s', async (value, tab) => {
    const user = userEvent.setup();
    validationContext.isUsingRealSpendingLimits = true;
    vi.mocked(updateProperties).mockResolvedValue({ success: true });
    renderSystemProperties({ globalSettings: { globalInterceptors: [], spendingLimits: VALID_SPENDING_LIMITS } });

    await openSpendingLimitsTab(user);
    const costObject = screen.getByRole('textbox', { name: SystemPropertiesI18nKey.DefaultCostObjectLabel });
    await user.clear(costObject);
    if (value) {
      await user.type(costObject, value);
    }
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
    await user.click(screen.getByText(tab));
    const save = screen.getByRole('button', { name: ButtonsI18nKey.Save });
    expect(save).toBeDisabled();
    await user.click(save);
    expect(updateProperties).not.toHaveBeenCalled();
    expect(showNotification).not.toHaveBeenCalled();

    await openSpendingLimitsTab(user);
    await user.clear(screen.getByRole('textbox', { name: SystemPropertiesI18nKey.DefaultCostObjectLabel }));
    await user.type(screen.getByRole('textbox', { name: SystemPropertiesI18nKey.DefaultCostObjectLabel }), 'TEAM-B');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));
    expect(updateProperties).toHaveBeenCalledWith(
      { globalInterceptors: [], spendingLimits: { ...VALID_SPENDING_LIMITS, defaultCostObject: 'TEAM-B' } },
      undefined,
    );
  });

  test.each(['', '   '])('blocks Save for stored cost object "%s" without opening Spending Limits', async (value) => {
    const user = userEvent.setup();
    validationContext.isUsingRealSpendingLimits = true;
    renderSystemProperties({
      globalSettings: {
        globalInterceptors: [],
        spendingLimits: { ...VALID_SPENDING_LIMITS, defaultCostObject: value },
      },
    });

    await user.click(screen.getByRole('button', { name: 'change-interceptors' }));
    const save = screen.getByRole('button', { name: ButtonsI18nKey.Save });
    expect(save).toBeDisabled();
    await user.click(save);
    expect(updateProperties).not.toHaveBeenCalled();
    expect(showNotification).not.toHaveBeenCalled();
  });

  test('marks a hidden invalid spending tab and clears its status after correction', async () => {
    const user = userEvent.setup();
    validationContext.isUsingRealSpendingLimits = true;
    renderSystemProperties({
      globalSettings: {
        globalInterceptors: [],
        spendingLimits: { ...VALID_SPENDING_LIMITS, defaultCostObject: '' },
      },
    });

    const tab = screen.getByRole('tab', { name: new RegExp(TabsI18nKey.SpendingLimits) });
    expect(tab).toHaveAccessibleName(`${TabsI18nKey.SpendingLimits}: ${TabsI18nKey.StatusError}`);
    await user.click(tab);
    await user.type(screen.getByRole('textbox', { name: SystemPropertiesI18nKey.DefaultCostObjectLabel }), 'TEAM');
    expect(tab).toHaveAccessibleName(TabsI18nKey.SpendingLimits);
  });

  test('restores Save availability after discarding an invalid cost object on another tab', async () => {
    const user = userEvent.setup();
    validationContext.isUsingRealSpendingLimits = true;
    renderSystemProperties({ globalSettings: { globalInterceptors: [], spendingLimits: VALID_SPENDING_LIMITS } });

    await openSpendingLimitsTab(user);
    await user.clear(screen.getByRole('textbox', { name: SystemPropertiesI18nKey.DefaultCostObjectLabel }));
    await user.click(screen.getByText(TabsI18nKey.GlobalInterceptors));
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Discard }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Discard }));
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'change-interceptors' }));
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeEnabled();
    expect(updateProperties).not.toHaveBeenCalled();
  });

  test('keeps an invalid cost object registered when an earlier save resets validation', async () => {
    const user = userEvent.setup();
    validationContext.isUsingRealSpendingLimits = true;
    let resolveSave!: (result: Awaited<ReturnType<typeof updateProperties>>) => void;
    vi.mocked(updateProperties).mockReturnValue(new Promise((resolve) => (resolveSave = resolve)));
    renderSystemProperties({ globalSettings: { globalInterceptors: [], spendingLimits: VALID_SPENDING_LIMITS } });

    await user.click(screen.getByRole('button', { name: 'change-interceptors' }));
    await openSpendingLimitsTab(user);
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));
    await user.clear(screen.getByRole('textbox', { name: SystemPropertiesI18nKey.DefaultCostObjectLabel }));
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();

    await act(async () => resolveSave({ success: true }));
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
    await user.click(screen.getByText(TabsI18nKey.GlobalInterceptors));
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
    expect(updateProperties).toHaveBeenCalledOnce();
  });

  test('shows Core’s rejection as an error notification and keeps the edit on screen', async () => {
    const user = userEvent.setup();
    (updateProperties as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      errorHeader: 'Bad Request',
      errorMessage: 'Invalid spendingLimits',
    });
    renderSystemProperties({ doesSettingsExist: true, globalSettings: { globalInterceptors: [] } });

    await openSpendingLimitsTab(user);
    await user.click(screen.getByText('change-spending-limits'));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Bad Request', description: 'Invalid spendingLimits' }),
    );
    expect(routerRefresh).not.toHaveBeenCalled();
    expect(screen.getByText('spending-mode:enforce')).toBeTruthy();
  });
});
