import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Menu from './Menu';
import { MenuI18nKey } from '../../constants/i18n';

vi.mock('next/navigation', () => ({
  usePathname: () => 'en',
  useRouter: () => [],
}));

describe('Menu', () => {
  it('renders Sidebar and MenuContent with open state', () => {
    render(<Menu disableMenuItems={['item1']} />);
    expect(screen.getByText(MenuI18nKey.AccessManagement)).toBeInTheDocument();
  });
});
