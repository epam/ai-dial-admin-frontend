import { MenuI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { fireEvent, render, screen } from '@testing-library/react';
import { WelcomeViewI18nKey } from './i18n';
import WelcomeView from './WelcomeView';
import { beforeAll, describe, expect, test, vi } from 'vitest';

const router: ApplicationRoute[] = [];
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: vi.fn(),
}));

describe('WelcomeView', () => {
  beforeAll(() => {
    global.window.open = vi.fn();
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
