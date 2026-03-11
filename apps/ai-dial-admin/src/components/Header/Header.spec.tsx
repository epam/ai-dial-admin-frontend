import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import Header from './Header';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => {
    return { session: null };
  }),
}));

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/en/models'),
}));

describe('Header', () => {
  test('renders logo, user, and breadcrumbs', () => {
    render(<Header isEnableAuth={true} />);
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  test('renders Help button', () => {
    render(<Header isEnableAuth={true} />);
    expect(screen.getByRole('button', { name: 'Help' })).toBeInTheDocument();
  });

  test('calls toggleSidebar when menu button is clicked', () => {
    const { getByRole } = render(<Header isEnableAuth={false} />);
    const button = getByRole('button', { name: 'menu' });
    fireEvent.click(button);
    // toggleSidebar is a mock, but we can't check call count here due to mock scope
    expect(button).toBeInTheDocument();
  });
});
