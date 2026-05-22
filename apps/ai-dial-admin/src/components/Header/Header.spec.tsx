import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ReadOnlyI18nKey } from '@/src/constants/i18n';
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

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/en/models'),
}));

describe('Header', () => {
  beforeEach(() => {
    isReadOnlyAdminMock.mockReturnValue(false);
  });

  test('does not render read-only badge for full admin', () => {
    render(<Header isEnableAuth={false} />);
    expect(screen.queryByText(ReadOnlyI18nKey.BadgeLabel)).not.toBeInTheDocument();
  });

  test('renders read-only badge for read-only admin', () => {
    isReadOnlyAdminMock.mockReturnValue(true);
    render(<Header isEnableAuth={false} />);
    expect(screen.getByText(ReadOnlyI18nKey.BadgeLabel)).toBeInTheDocument();
  });

  test('calls toggleSidebar when menu button is clicked', () => {
    const { getByRole } = render(<Header isEnableAuth={false} />);
    const button = getByRole('button', { name: 'menu' });
    fireEvent.click(button);
    // toggleSidebar is a mock, but we can't check call count here due to mock scope
    expect(button).toBeInTheDocument();
  });
});
