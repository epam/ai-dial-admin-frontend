import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import CopyButton from './CopyButton';

describe('Common components :: CopyButton', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn() }, configurable: true });
  });

  test('Should render button with icon and be accessible by role', () => {
    render(<CopyButton valueLabel="Copy this" value="value" />);
    expect(screen.getByRole('button', { name: 'copy Copy this' })).toBeInTheDocument();
  });

  test('Should fall back to a bare name when nothing names the value', () => {
    render(<CopyButton value="value" />);
    expect(screen.getByRole('button', { name: 'copy' })).toBeInTheDocument();
  });

  test('Should draw the labelled button with the 2.0 outlined neutral button, named by its label', () => {
    render(<CopyButton buttonLabel="Copy" valueLabel="the definition" value="value" />);

    expect(screen.getByRole('button', { name: 'Copy' })).toHaveClass('dial-kit-neutral-outlined-button');
  });

  test('Should copy through the labelled button as well', () => {
    render(<CopyButton buttonLabel="Copy" valueLabel="the definition" value="labelled value" />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('labelled value');
  });

  test('Should copy text and show notification on click', () => {
    const { getByRole } = render(<CopyButton value="copied value" valueLabel="Copy this" />);
    fireEvent.click(getByRole('button', { name: 'copy Copy this' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('copied value');
  });
});
