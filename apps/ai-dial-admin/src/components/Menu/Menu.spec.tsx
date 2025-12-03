import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { MenuI18nKey } from '@/src/constants/i18n';
import Menu from './Menu';

vi.mock('next/navigation', () => ({
  usePathname: () => 'en',
  useRouter: () => [],
}));

describe('Menu', () => {
  test('renders Sidebar and MenuContent with open state', () => {
    render(<Menu disableMenuItems={['item1']} />);

    const items = screen.getAllByText(MenuI18nKey.AccessManagement);

    expect(items.length).toBeGreaterThan(0);
    expect(items[0]).toBeInTheDocument();
  });
});
