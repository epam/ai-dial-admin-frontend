import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import ProfileButton from './ProfileButton';

const toggleUserMenu = vi.fn();
vi.mock('next-auth/react', () => ({ useSession: () => ({ data: { user: {} } }) }));
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ userMenuOpen: false, toggleUserMenu }),
}));

describe('ProfileButton', () => {
  test('renders user icon when no image and menu closed', () => {
    render(<ProfileButton />);
    expect(screen.getByLabelText('Account settings')).toBeInTheDocument();
  });

  test('calls toggleUserMenu on click', () => {
    render(<ProfileButton />);
    fireEvent.click(screen.getByLabelText('Account settings'));
    expect(toggleUserMenu).toHaveBeenCalled();
  });
});
