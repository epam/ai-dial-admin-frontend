import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { updateProperties } from '@/src/app/[lang]/system-properties/actions';
import SystemProperties from '@/src/components/SystemProperties/SystemProperties';
import {
  ButtonsI18nKey,
  EntitiesI18nKey,
  SystemPropertiesI18nKey,
  TabsI18nKey,
  UpdateI18nKey,
} from '@/src/constants/i18n';
import { SaveValidationContextProvider, ValidationActionType } from '@/src/context/SaveValidationContext';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { GlobalSettings, RateLimitSchedule, WeekDay } from '@/src/models/system-properties';

const routerRefresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: routerRefresh }) }));

const showNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification, removeNotification: vi.fn() }),
}));

vi.mock('@/src/app/[lang]/system-properties/actions');

// Most page tests use controllable validation. Picker integration cases switch to the real hook and
// provider so blur-to-Save ordering is tested through the actual validation reducer.
const validationContext = vi.hoisted(() => ({
  isValid: true,
  isUsingRealSchedule: false,
  dispatch: vi.fn(),
  jsonErrors: [] as unknown[],
  jsonErrorNotifications: [] as unknown[],
}));
vi.mock('@/src/context/SaveValidationContext', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/src/context/SaveValidationContext')>();
  return {
    ...original,
    useSaveValidationContext: () =>
      validationContext.isUsingRealSchedule ? original.useSaveValidationContext() : validationContext,
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

describe('SystemProperties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validationContext.isValid = true;
    validationContext.isUsingRealSchedule = false;
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
});
