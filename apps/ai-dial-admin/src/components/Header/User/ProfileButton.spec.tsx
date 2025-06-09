import { render } from '@testing-library/react';
import ProfileButton from './ProfileButton';

jest.mock('@/src/context/AppContext', () => ({
  useAppContext: jest.fn(() => {
    return { toggleUserMenu: jest.fn(), userMenuOpen: false };
  }),
}));

jest.mock('next-auth/react', () => {
  const originalModule = jest.requireActual('next-auth/react');

  return {
    ...originalModule,
    useSession: jest.fn(() => {
      return { data: { session: { user: { image: 'image ' } } } };
    }),
  };
});

describe('Header :: ProfileButton', () => {
  it('Should render successfully', () => {
    const { baseElement } = render(<ProfileButton />);
    expect(baseElement).toBeTruthy();
  });
});
