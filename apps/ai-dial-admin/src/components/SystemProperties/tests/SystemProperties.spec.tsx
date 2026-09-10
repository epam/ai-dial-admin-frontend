import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { updateProperties } from '@/src/app/[lang]/system-properties/actions';
import SystemProperties from '@/src/components/SystemProperties/SystemProperties';
import { ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { GlobalSettings } from '@/src/models/system-properties';

const routerRefresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: routerRefresh }) }));

const showNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification, removeNotification: vi.fn() }),
}));

vi.mock('@/src/app/[lang]/system-properties/actions');

// AG Grid is heavy and not meaningful in jsdom — stand in with a button that fires the same
// onChangeInterceptors contract the real grid's drag/add/remove handlers all funnel into.
vi.mock('@/src/components/EntityView/Interceptors/GlobalInterceptors', () => ({
  default: ({ onChangeInterceptors }: { onChangeInterceptors: (interceptors: string[]) => void }) => (
    <button onClick={() => onChangeInterceptors(['new-interceptor'])}>change-interceptors</button>
  ),
}));

const INTERCEPTORS_MOCK: DialInterceptor[] = [];

const renderSystemProperties = (props?: {
  globalSettings?: GlobalSettings | null;
  doesSettingsExist?: boolean;
  optionWarnings?: EntitiesI18nKey[];
}) =>
  render(
    <SystemProperties
      interceptors={INTERCEPTORS_MOCK}
      globalSettings={props?.globalSettings ?? null}
      doesSettingsExist={props?.doesSettingsExist ?? false}
      optionWarnings={props?.optionWarnings}
    />,
  );

describe('SystemProperties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
