import { appContextMock } from '@/test-mocks/app-context';
import { MenuI18nKey, ReadOnlyI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { fireEvent, render, screen } from '@testing-library/react';
import { WelcomeViewI18nKey } from './i18n';
import WelcomeView from './WelcomeView';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { navigationMock } from '@/test-mocks/navigation';

const adminApiEnabled = { value: true };
const fullAdmin = { value: true };
beforeEach(() => {
  appContextMock.use(() => ({
    featureFlags: { adminApiEnabled: adminApiEnabled.value },
    isFullAdmin: fullAdmin.value,
  }));
});

describe('WelcomeView', () => {
  beforeEach(() => {
    vi.stubGlobal('open', vi.fn());
    appContextMock.set({ isReadOnlyAdmin: false });
    adminApiEnabled.value = true;
    fullAdmin.value = true;
  });

  test('renders read-only banner for read-only admin', () => {
    appContextMock.set({ isReadOnlyAdmin: true });
    fullAdmin.value = false;
    render(<WelcomeView disableMenuItems={[]} dialLink="link" docLink="link" />);

    expect(screen.getByText(ReadOnlyI18nKey.BannerTitle)).toBeInTheDocument();
    expect(screen.getByText(ReadOnlyI18nKey.Description)).toBeInTheDocument();
  });

  test('hides Import, Export and System properties quick actions for a non-full admin', () => {
    fullAdmin.value = false;
    render(<WelcomeView disableMenuItems={[]} dialLink="link" docLink="link" />);

    expect(screen.queryByText(MenuI18nKey.ImportConfig)).not.toBeInTheDocument();
    expect(screen.queryByText(MenuI18nKey.ExportConfig)).not.toBeInTheDocument();
    expect(screen.queryByText(MenuI18nKey.SystemProperties)).not.toBeInTheDocument();
  });

  test('hides Import/Export quick actions when the admin API is disabled', () => {
    adminApiEnabled.value = false;
    render(<WelcomeView disableMenuItems={[]} dialLink="link" docLink="link" />);

    expect(screen.queryByText(MenuI18nKey.ImportConfig)).not.toBeInTheDocument();
    expect(screen.queryByText(MenuI18nKey.ExportConfig)).not.toBeInTheDocument();
    expect(screen.getByText(MenuI18nKey.SystemProperties)).toBeInTheDocument();
  });

  test('renders and triggers actions without test ids', () => {
    render(<WelcomeView disableMenuItems={[]} dialLink="link" docLink="link" />);

    const documentationBtn = screen.getByText(WelcomeViewI18nKey.ViewDocumentation);
    const dialBtn = screen.getByText(WelcomeViewI18nKey.OpenDial);
    const importBtn = screen.getByText(MenuI18nKey.ImportConfig);
    const exportBtn = screen.getByText(MenuI18nKey.ExportConfig);

    fireEvent.click(documentationBtn);
    fireEvent.click(dialBtn);
    fireEvent.click(importBtn);
    fireEvent.click(exportBtn);

    expect(window.open).toHaveBeenCalledWith('link', '_blank');
    expect(navigationMock.router.push).toHaveBeenNthCalledWith(1, ApplicationRoute.ImportConfig);
    expect(navigationMock.router.push).toHaveBeenNthCalledWith(2, ApplicationRoute.ExportConfig);
    expect(screen.getByText(WelcomeViewI18nKey.QuickActions)).toBeInTheDocument();
  });
});
