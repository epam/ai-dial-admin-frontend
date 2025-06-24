import { render } from '@testing-library/react';
import Header from './Header';
import UserMobile from './User/UserMobile';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: vi.fn(() => {
    return { sidebarOpen: true, toggleSidebar: vi.fn(), userMenuOpen: true };
  }),
}));

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => {
    return { session: null };
  }),
}));

vi.mock('@/src/context/ThemeContext', () => ({
  useTheme: vi.fn(() => {
    return { themes: [], currentTheme: '', setTheme: vi.fn() };
  }),
}));

describe('Header', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(<Header isEnableAuth={true} />);
    expect(baseElement).toBeTruthy();
  });
});

describe('Header :: UserMobile ', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(<UserMobile isEnableAuth={true} />);
    expect(baseElement).toBeTruthy();
  });
});
