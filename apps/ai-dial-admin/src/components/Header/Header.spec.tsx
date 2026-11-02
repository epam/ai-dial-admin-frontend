import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { HeaderI18nKey, ReadOnlyI18nKey } from '@/src/constants/i18n';
import { MAIN_MENU_ID } from '@/src/constants/main-layout';
import { useTheme } from '@/src/context/ThemeContext';
import Header from './Header';

const isReadOnlyAdminMock = vi.fn(() => false);
vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: () => isReadOnlyAdminMock(),
}));

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => {
    return { session: null };
  }),
}));

// One shared router, like the real one: `Breadcrumbs` lists it as an effect dependency.
const { router } = vi.hoisted(() => ({ router: { push: vi.fn() } }));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => router),
  usePathname: vi.fn(() => '/en/models'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

describe('Header', () => {
  const renderHeader = (docLink?: string) =>
    render(<Header isEnableAuth={false} appName="DIAL Admin" docLink={docLink} />);

  beforeEach(() => {
    isReadOnlyAdminMock.mockReturnValue(false);
    vi.mocked(useTheme).mockReturnValue({ currentTheme: 'dark' } as ReturnType<typeof useTheme>);
  });

  test('does not render read-only badge for full admin', () => {
    renderHeader();
    expect(screen.queryByText(ReadOnlyI18nKey.BadgeLabel)).not.toBeInTheDocument();
  });

  test('renders read-only badge for read-only admin', () => {
    isReadOnlyAdminMock.mockReturnValue(true);
    renderHeader();
    expect(screen.getByText(ReadOnlyI18nKey.BadgeLabel)).toBeInTheDocument();
  });

  test('reads the read-only explanation with the badge, without making it a control', () => {
    isReadOnlyAdminMock.mockReturnValue(true);
    renderHeader();
    expect(screen.getByText(ReadOnlyI18nKey.Description)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ReadOnlyI18nKey.BadgeLabel })).toBeNull();
  });

  test('does not render the help button without a documentation link', () => {
    renderHeader();
    expect(screen.queryByRole('button', { name: HeaderI18nKey.Help })).not.toBeInTheDocument();
  });

  test('names the sidebar toggle and points it at the main menu', () => {
    renderHeader();
    expect(screen.getByRole('button', { name: HeaderI18nKey.ToggleSidebar })).toHaveAttribute(
      'aria-controls',
      MAIN_MENU_ID,
    );
  });

  test('renders the theme logo as a home link named after the product', () => {
    vi.mocked(useTheme).mockReturnValue({ currentThemeLogo: 'admin-logo.svg' } as ReturnType<typeof useTheme>);
    renderHeader();
    expect(screen.getByRole('img', { name: 'DIAL Admin' }).closest('a')).toHaveAttribute('href', '/');
  });
});
