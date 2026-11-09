import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { MenuI18nKey } from '@/src/constants/i18n';
import Menu from './Menu';

vi.mock('next/navigation', () => ({
  usePathname: () => 'en',
}));

describe('Menu', () => {
  test('renders Sidebar and MenuContent with open state', () => {
    render(<Menu disableMenuItems={['item1']} />);

    expect(screen.getByRole('list', { name: MenuI18nKey.AccessManagement })).toBeInTheDocument();
  });
});
