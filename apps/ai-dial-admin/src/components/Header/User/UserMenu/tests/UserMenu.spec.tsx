import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from 'next-auth/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { HeaderI18nKey } from '@/src/constants/i18n';

import UserMenu from '@/src/components/Header/User/UserMenu/UserMenu';

describe('UserMenu', () => {
  const openMenu = async () => {
    const user = userEvent.setup();
    render(<UserMenu isEnableAuth />);
    await user.click(screen.getByRole('button', { name: HeaderI18nKey.AccountSettings }));
  };

  beforeEach(() => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Dana Kim', email: 'dana@example.com' }, expires: '' },
      status: 'authenticated',
      update: vi.fn(),
    });
  });

  test('shows the user name and email in the menu header', async () => {
    await openMenu();

    expect(await screen.findByText('dana@example.com')).toBeTruthy();
    expect(screen.getByText('Dana Kim')).toBeTruthy();
  });

  test('omits the email line when the session has no email', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Dana Kim' }, expires: '' },
      status: 'authenticated',
      update: vi.fn(),
    });

    await openMenu();

    expect(await screen.findByText('Dana Kim')).toBeTruthy();
    expect(screen.queryByText('dana@example.com')).toBeNull();
  });
});
