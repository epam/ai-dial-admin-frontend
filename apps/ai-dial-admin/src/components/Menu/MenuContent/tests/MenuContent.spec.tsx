import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { MenuI18nKey } from '@/src/constants/i18n';
import { UnitNamespace } from '@/src/models/user-access';

import MenuContent from '../MenuContent';

const currentPath = { value: '/en/home' };
vi.mock('next/navigation', () => ({
  usePathname: () => currentPath.value,
}));

const adminApiEnabled = { value: true };
const readOnlyAdmin = { value: false };
const unitMode = { isUnitMode: false, readable: new Set<UnitNamespace>() };
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({
    featureFlags: { adminApiEnabled: adminApiEnabled.value },
    isReadOnlyAdmin: readOnlyAdmin.value,
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

    expect(screen.getAllByRole('link', { name: MenuI18nKey.ImportConfig }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: MenuI18nKey.ExportConfig }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: MenuI18nKey.SystemProperties }).length).toBeGreaterThan(0);
  });

  test('hides Import/Export config actions in the expanded bar when the admin API is disabled', () => {
    adminApiEnabled.value = false;
    render(<MenuContent disableMenuItems={[]} isSidebarOpen />);

    expect(screen.queryByRole('link', { name: MenuI18nKey.ImportConfig })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: MenuI18nKey.ExportConfig })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: MenuI18nKey.SystemProperties }).length).toBeGreaterThan(0);
  });

  test('hides Import/Export config actions in the collapsed dropdown when the admin API is disabled', () => {
    adminApiEnabled.value = false;
    render(<MenuContent disableMenuItems={[]} isSidebarOpen={false} />);

    expect(screen.queryByText(MenuI18nKey.ImportConfig)).not.toBeInTheDocument();
    expect(screen.queryByText(MenuI18nKey.ExportConfig)).not.toBeInTheDocument();
  });
});

describe('MenuContent — footer pages', () => {
  beforeEach(() => {
    adminApiEnabled.value = true;
  });

  afterEach(() => {
    currentPath.value = '/en/home';
  });

  test('marks the footer page the user is on as the current page', () => {
    currentPath.value = '/en/import-config';
    render(<MenuContent disableMenuItems={[]} isSidebarOpen />);

    expect(screen.getByRole('link', { name: MenuI18nKey.ImportConfig })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: MenuI18nKey.ExportConfig })).not.toHaveAttribute('aria-current');
  });

  test('renders a single navigation when collapsed', () => {
    render(<MenuContent disableMenuItems={[]} isSidebarOpen={false} />);

    expect(screen.getByRole('navigation', { name: MenuI18nKey.MainNavigation })).toBeInTheDocument();
  });
});

describe('MenuContent — read-only admin', () => {
  beforeEach(() => {
    adminApiEnabled.value = true;
    readOnlyAdmin.value = true;
  });

  afterEach(() => {
    readOnlyAdmin.value = false;
  });

  test('hides Import/Export config actions in the collapsed menu', () => {
    render(<MenuContent disableMenuItems={[]} isSidebarOpen={false} />);

    expect(screen.queryByRole('link', { name: MenuI18nKey.ImportConfig })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: MenuI18nKey.ExportConfig })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: MenuI18nKey.SystemProperties })).toBeInTheDocument();
  });

  test('keeps Import/Export config actions in the expanded menu', () => {
    render(<MenuContent disableMenuItems={[]} isSidebarOpen />);

    expect(screen.getByRole('link', { name: MenuI18nKey.ImportConfig })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: MenuI18nKey.ExportConfig })).toBeInTheDocument();
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

    expect(screen.queryByRole('link', { name: MenuI18nKey.ImportConfig })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: MenuI18nKey.ExportConfig })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: MenuI18nKey.SystemProperties })).not.toBeInTheDocument();
  });

  test('offers only the sections whose namespace is readable', () => {
    render(<MenuContent disableMenuItems={[]} isSidebarOpen />);

    expect(screen.getAllByRole('link', { name: MenuI18nKey.Prompts }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: MenuI18nKey.Files })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: MenuI18nKey.PlatformModels })).not.toBeInTheDocument();
  });
});
