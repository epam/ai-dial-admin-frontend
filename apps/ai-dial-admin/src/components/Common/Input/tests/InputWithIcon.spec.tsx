import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import InputWithIcon from '../InputWithIcon';
import { describe, expect, test, vi } from 'vitest';

describe('InputWithIcon', () => {
  test('renders input with placeholder', () => {
    const { getByPlaceholderText } = render(<InputWithIcon inputId="icon-input" placeholder="With icon" />);
    expect(getByPlaceholderText('With icon')).toBeInTheDocument();
  });

  test('renders iconBeforeInput and iconAfterInput', () => {
    const before = <span>B</span>;
    const after = <span>A</span>;
    const { container } = render(
      <InputWithIcon inputId="icon-input" placeholder="With icon" iconBeforeInput={before} iconAfterInput={after} />,
    );
    // Check for the text content of the icons
    expect(container.textContent).toContain('B');
    expect(container.textContent).toContain('A');
  });

  test('calls onChange when input changes', () => {
    const handleChange = vi.fn();
    const { getByPlaceholderText } = render(
      <InputWithIcon inputId="icon-input" placeholder="Type here" onChange={handleChange} />,
    );
    const input = getByPlaceholderText('Type here');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalledWith('test');
  });
});
