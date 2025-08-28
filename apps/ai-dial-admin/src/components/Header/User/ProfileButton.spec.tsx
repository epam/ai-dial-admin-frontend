import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProfileButton from './ProfileButton';

vi.mock('next-auth/react', () => ({ useSession: () => ({ data: { user: {} } }) }));
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ userMenuOpen: false, toggleUserMenu: vi.fn() }),
}));

describe('ProfileButton', () => {
  it('renders user icon when no image and menu closed', () => {
    render(<ProfileButton />);
    expect(screen.getByLabelText('Account settings')).toBeInTheDocument();
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('calls toggleUserMenu on click', () => {
    const toggleUserMenu = vi.fn();
    vi.mocked(require('@/src/context/AppContext').useAppContext).mockReturnValue({
      userMenuOpen: false,
      toggleUserMenu,
    });
    render(<ProfileButton />);
    fireEvent.click(screen.getByLabelText('Account settings'));
    expect(toggleUserMenu).toHaveBeenCalled();
  });
});
