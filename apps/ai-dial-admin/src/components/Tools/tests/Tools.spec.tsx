import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Tools from '../Tools';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import * as AppContext from '@/src/context/AppContext';

beforeEach(() => {
  vi.spyOn(AppContext, 'useAppContext').mockReturnValue({
    sidebar: {
      show: false,
      content: null,
      closeSidebar: vi.fn(),
      toggleIsMenuClosed: vi.fn(),
      isMenuClosed: false,
    },
    toggleSidebar: vi.fn(),
  } as any);
});

describe('Tools', () => {
  test('renders with no containerId', () => {
    render(<Tools />);

    expect(screen.getByText(EntitiesI18nKey.NoTools)).toBeInTheDocument();
  });

  test('keeps the typed search value visible in the search field', async () => {
    const user = userEvent.setup();
    render(<Tools />);

    await user.type(screen.getByRole('textbox'), 'weather');

    expect(screen.getByRole('textbox')).toHaveValue('weather');
  });
});
