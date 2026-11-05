import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { MenuI18nKey } from '@/src/constants/i18n';
import { UnitNamespace } from '@/src/models/user-access';

import MenuContent from '../MenuContent';

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/home',
  useRouter: () => ({ push: vi.fn() }),
}));

const adminApiEnabled = { value: true };
const unitMode = { isUnitMode: false, readable: new Set<UnitNamespace>() };
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({
    featureFlags: { adminApiEnabled: adminApiEnabled.value, catalogEnabled: true },
    isReadOnlyAdmin: false,
    isUnitMode: unitMode.isUnitMode,
    canReadNamespace: (namespace: UnitNamespace) => unitMode.readable.has(namespace),
  }),
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

describe('MenuContent — unit mode', () => {
  beforeEach(() => {
    adminApiEnabled.value = true;
    unitMode.isUnitMode = true;
    unitMode.readable = new Set([UnitNamespace.PROMPTS]);
  });

  afterEach(() => {
    unitMode.isUnitMode = false;
    unitMode.readable = new Set();
  });

  test('hides the admin Import, Export and System properties actions', () => {
    render(<MenuContent disableMenuItems={[]} isSidebarOpen />);

    expect(screen.queryByRole('button', { name: MenuI18nKey.ImportConfig })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: MenuI18nKey.ExportConfig })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: MenuI18nKey.SystemProperties })).not.toBeInTheDocument();
  });

  test('offers only the sections whose namespace is readable', () => {
    render(<MenuContent disableMenuItems={[]} isSidebarOpen />);

    expect(screen.getAllByRole('link', { name: MenuI18nKey.Prompts }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: MenuI18nKey.Files })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: MenuI18nKey.PlatformModels })).not.toBeInTheDocument();
  });
});
