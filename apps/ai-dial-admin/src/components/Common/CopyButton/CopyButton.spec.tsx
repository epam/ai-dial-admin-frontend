import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import CopyButton from './CopyButton';

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: vi.fn(),
  }),
}));

describe('Common components :: CopyButton', () => {
  test('Should render button with icon and be accessible by role', () => {
    render(<CopyButton title="Copy this" field="value" />);
    expect(screen.getByRole('button', { name: 'copy' })).toBeInTheDocument();
  });

  test('Should copy text and show notification on click', () => {
    const { getByRole } = render(<CopyButton field="copied value" />);
    fireEvent.click(getByRole('button', { name: 'copy' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('copied value');
  });
});
