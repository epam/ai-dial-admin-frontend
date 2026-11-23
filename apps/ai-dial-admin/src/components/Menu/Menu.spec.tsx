import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { MenuI18nKey } from '@/src/constants/i18n';
import { navigationMock } from '@/test-mocks/navigation';
import Menu from './Menu';

describe('Menu', () => {
  beforeEach(() => {
    navigationMock.setPathname('en');
  });

  test('renders Sidebar and MenuContent with open state', () => {
    render(<Menu disableMenuItems={['item1']} />);

    expect(screen.getByRole('list', { name: MenuI18nKey.AccessManagement })).toBeInTheDocument();
  });
});
