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

  test('Should draw the labelled button with the 2.0 button when the page opts in, named by its label', () => {
    render(<CopyButton buttonLabel="Copy" valueLabel="the definition" value="value" isDesignSystem2 />);

    const button = screen.getByRole('button', { name: 'Copy' });
    expect(button).toHaveClass('dial-kit-neutral-outlined-button');
  });

  test('Should copy through the 2.0 button as well', () => {
    render(<CopyButton buttonLabel="Copy" valueLabel="the definition" value="2.0 value" isDesignSystem2 />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('2.0 value');
  });

  test('Should keep the 1.0 button without the opt-in', () => {
    render(<CopyButton buttonLabel="Copy" valueLabel="the definition" value="value" />);

    expect(screen.getByRole('button', { name: 'Copy' })).not.toHaveClass('dial-kit-neutral-outlined-button');
  });

  test('Should copy text and show notification on click', () => {
    const { getByRole } = render(<CopyButton value="copied value" valueLabel="Copy this" />);
    fireEvent.click(getByRole('button', { name: 'copy Copy this' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('copied value');
  });
});
