import { MenuI18nKey, ReadOnlyI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { fireEvent, render, screen } from '@testing-library/react';
import { WelcomeViewI18nKey } from './i18n';
import WelcomeView from './WelcomeView';
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

const isReadOnlyAdminMock = vi.fn(() => false);
vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: () => isReadOnlyAdminMock(),
}));

const router: ApplicationRoute[] = [];
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: vi.fn(),
}));

describe('WelcomeView', () => {
  beforeAll(() => {
    global.window.open = vi.fn();
  });

  beforeEach(() => {
    isReadOnlyAdminMock.mockReturnValue(false);
  });

  test('renders read-only banner and hides import/export for read-only admin', () => {
    isReadOnlyAdminMock.mockReturnValue(true);
    render(<WelcomeView disableMenuItems={[]} dialLink="link" docLink="link" />);

    expect(screen.getByText(ReadOnlyI18nKey.BannerTitle)).toBeInTheDocument();
    expect(screen.getByText(ReadOnlyI18nKey.BannerDescription)).toBeInTheDocument();
    expect(screen.queryByText(MenuI18nKey.ImportConfig)).not.toBeInTheDocument();
    expect(screen.queryByText(MenuI18nKey.ExportConfig)).not.toBeInTheDocument();
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

    expect(global.window.open).toHaveBeenCalledWith('link', '_blank');
    expect(router).toEqual([ApplicationRoute.ImportConfig, ApplicationRoute.ExportConfig]);
    expect(screen.getByText(WelcomeViewI18nKey.QuickActions)).toBeInTheDocument();
  });
});
