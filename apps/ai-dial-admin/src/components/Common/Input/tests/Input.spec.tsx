import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Input from '../Input';
import { describe, expect, test, vi } from 'vitest';

describe('Input', () => {
  test('renders with default props', () => {
    const { getByPlaceholderText } = render(<Input inputId="test-input" placeholder="Enter text" />);
    expect(getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  test('calls onChange when value changes', () => {
    const handleChange = vi.fn();
    const { getByPlaceholderText } = render(
      <Input inputId="test-input" placeholder="Type here" onChange={handleChange} />,
    );
    const input = getByPlaceholderText('Type here');
    fireEvent.change(input, { target: { value: 'hello' } });
    expect(handleChange).toHaveBeenCalledWith('hello');
  });

  test('is disabled when disabled prop is true', () => {
    const { getByPlaceholderText } = render(<Input inputId="test-input" placeholder="Disabled" disabled />);
    const input = getByPlaceholderText('Disabled');
    expect(input).toBeDisabled();
  });
});
