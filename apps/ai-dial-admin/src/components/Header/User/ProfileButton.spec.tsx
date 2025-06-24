import { render } from '@testing-library/react';
import ProfileButton from './ProfileButton';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: vi.fn(() => {
    return { toggleUserMenu: vi.fn(), userMenuOpen: false };
  }),
}));

vi.mock('next-auth/react', () => {
  return {
    useSession: vi.fn(() => {
      return { data: { session: { user: { image: 'image ' } } } };
    }),
  };
});

describe('Header :: ProfileButton', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(<ProfileButton />);
    expect(baseElement).toBeTruthy();
  });
});
