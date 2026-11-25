import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import TryOutHeader from '@/src/components/TryOut/components/TryOutHeader';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { appContextMock } from '@/test-mocks/app-context';

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    CloseButton: ({ onClose }: { onClose: () => void }) => (
      <button type="button" onClick={onClose}>
        Close
      </button>
    ),
  };
});

describe('TryOutHeader', () => {
  test('renders the title and the extra actions', () => {
    render(<TryOutHeader leadingActions={<span>leading</span>} trailingActions={<span>trailing</span>} />);

    expect(screen.getByRole('heading', { name: ButtonsI18nKey.TryOut })).toBeInTheDocument();
    expect(screen.getByText('leading')).toBeInTheDocument();
    expect(screen.getByText('trailing')).toBeInTheDocument();
  });

  test('closes the sidebar from the close button', async () => {
    render(<TryOutHeader />);

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(appContextMock.sidebar.closeSidebar).toHaveBeenCalledTimes(1);
  });
});
