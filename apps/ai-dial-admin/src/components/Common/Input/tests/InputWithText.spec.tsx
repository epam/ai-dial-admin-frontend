import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InputWithText from '@/src/components/Common/Input/InputWithText';

describe('InputWithText', () => {
  test('renders input with text before it', () => {
    render(<InputWithText textBeforeInput={'text'} inputId="text-input" />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('text')).toBeInTheDocument();
  });

  test('renders default input if text not provided', () => {
    render(<InputWithText inputId="text-input" />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.queryByText('text')).not.toBeInTheDocument();
  });

  test('calls onChange when input changes', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<InputWithText inputId="text-input" onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, '1');

    expect(handleChange).toHaveBeenCalledWith('1');
  });

  test('renders with disabled prop', () => {
    render(<InputWithText inputId="text-input" disabled />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });
});
