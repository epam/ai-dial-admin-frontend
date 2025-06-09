import { render } from '@testing-library/react';
import Header from './Header';
import UserMobile from './User/UserMobile';

jest.mock('@/src/context/AppContext', () => ({
  useAppContext: jest.fn(() => {
    return { sidebarOpen: true, toggleSidebar: jest.fn(), userMenuOpen: true };
  }),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => {
    return { session: null };
  }),
}));

jest.mock('@/src/context/ThemeContext', () => ({
  useTheme: jest.fn(() => {
    return { themes: [], currentTheme: '', setTheme: jest.fn() };
  }),
}));

describe('Header', () => {
  it('Should render successfully', () => {
    const { baseElement } = render(<Header isEnableAuth={true} />);
    expect(baseElement).toBeTruthy();
  });
});

describe('Header :: UserMobile ', () => {
  it('Should render successfully', () => {
    const { baseElement } = render(<UserMobile isEnableAuth={true} />);
    expect(baseElement).toBeTruthy();
  });
});
