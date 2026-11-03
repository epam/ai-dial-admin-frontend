import { render, screen } from '@testing-library/react';
import { ButtonsI18nKey, HeaderI18nKey } from '@/src/constants/i18n';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import AvatarButton from '@/src/components/Header/User/AvatarButton';

vi.mock('next-auth/react', () => ({ useSession: () => ({ data: { user: { name: 'Dana Kim' } } }) }));

describe('AvatarButton', () => {
  test('renders a button named "Account settings" with the user initials', () => {
    render(<AvatarButton />);

    expect(screen.getByRole('button', { name: HeaderI18nKey.AccountSettings })).toBeInTheDocument();
    expect(screen.getByText('DK')).toBeInTheDocument();
  });

  test('calls onClick when activated', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<AvatarButton onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: HeaderI18nKey.AccountSettings }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  test('shows the given tooltip on hover', async () => {
    const user = userEvent.setup();
    render(<AvatarButton tooltip="Dana Kim" />);

    await user.hover(screen.getByRole('button', { name: HeaderI18nKey.AccountSettings }));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Dana Kim');
  });

  test('becomes a Close button with a close icon while its menu is open', () => {
    render(<AvatarButton isActive />);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Close })).toBeInTheDocument();
    expect(screen.queryByText('DK')).toBeNull();
  });

  test('names its tooltip Close while its menu is open', async () => {
    const user = userEvent.setup();
    render(<AvatarButton isActive tooltip="Dana Kim" />);

    await user.hover(screen.getByRole('button', { name: ButtonsI18nKey.Close }));

    expect(await screen.findByRole('tooltip')).toHaveTextContent(ButtonsI18nKey.Close);
  });
});
