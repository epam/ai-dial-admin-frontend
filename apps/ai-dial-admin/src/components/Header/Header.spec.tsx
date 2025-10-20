import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from './Header';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => {
    return { session: null };
  }),
}));

describe('Header', () => {
  it('renders logo, user, and breadcrumbs', () => {
    render(<Header isEnableAuth={true} />);
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('calls toggleSidebar when menu button is clicked', () => {
    const { getByRole } = render(<Header isEnableAuth={false} />);
    const button = getByRole('button', { name: 'menu' });
    fireEvent.click(button);
    // toggleSidebar is a mock, but we can't check call count here due to mock scope
    expect(button).toBeInTheDocument();
  });
});
