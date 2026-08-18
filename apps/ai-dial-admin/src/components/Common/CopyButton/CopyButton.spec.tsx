import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import CopyButton from './CopyButton';

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('Common components :: CopyButton', () => {
  test('Should render button with icon and be accessible by role', () => {
    render(<CopyButton valueLabel="Copy this" value="value" />);
    expect(screen.getByRole('button', { name: 'copy Copy this' })).toBeInTheDocument();
  });

  test('Should fall back to a bare name when nothing names the value', () => {
    render(<CopyButton value="value" />);
    expect(screen.getByRole('button', { name: 'copy' })).toBeInTheDocument();
  });

  test('Should copy text and show notification on click', () => {
    const { getByRole } = render(<CopyButton value="copied value" valueLabel="Copy this" />);
    fireEvent.click(getByRole('button', { name: 'copy Copy this' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('copied value');
  });
});
