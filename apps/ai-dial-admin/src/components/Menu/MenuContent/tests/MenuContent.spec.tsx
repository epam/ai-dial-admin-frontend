import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { MenuI18nKey } from '@/src/constants/i18n';

import MenuContent from '../MenuContent';

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/home',
  useRouter: () => ({ push: vi.fn() }),
}));

const adminApiEnabled = { value: true };
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ featureFlags: { adminApiEnabled: adminApiEnabled.value }, isReadOnlyAdmin: false }),
}));

describe('MenuContent — Import/Export actions', () => {
  beforeEach(() => {
    adminApiEnabled.value = true;
  });

  test('renders Import/Export config actions when the admin API is enabled', () => {
    render(<MenuContent disableMenuItems={[]} isSidebarOpen />);

    expect(screen.getAllByRole('button', { name: MenuI18nKey.ImportConfig }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: MenuI18nKey.ExportConfig }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: MenuI18nKey.SystemProperties }).length).toBeGreaterThan(0);
  });

  test('hides Import/Export config actions in the expanded bar when the admin API is disabled', () => {
    adminApiEnabled.value = false;
    render(<MenuContent disableMenuItems={[]} isSidebarOpen />);

    expect(screen.queryByRole('button', { name: MenuI18nKey.ImportConfig })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: MenuI18nKey.ExportConfig })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: MenuI18nKey.SystemProperties }).length).toBeGreaterThan(0);
  });

  test('hides Import/Export config actions in the collapsed dropdown when the admin API is disabled', () => {
    adminApiEnabled.value = false;
    render(<MenuContent disableMenuItems={[]} isSidebarOpen={false} />);

    expect(screen.queryByText(MenuI18nKey.ImportConfig)).not.toBeInTheDocument();
    expect(screen.queryByText(MenuI18nKey.ExportConfig)).not.toBeInTheDocument();
  });
});
