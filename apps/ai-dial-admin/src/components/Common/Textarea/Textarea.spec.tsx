import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import Textarea from './Textarea';
import { vi } from 'vitest';

describe('Textarea', () => {
  test('renders with value, placeholder, and id', () => {
    render(<Textarea value="hello" textareaId="my-textarea" placeholder="Type here" />);
    const textarea = screen.getByPlaceholderText('Type here');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('id', 'my-textarea');
    expect(textarea).toHaveValue('hello');
  });

  test('calls onChange when value changes', () => {
    const onChange = vi.fn();
    render(<Textarea value="" textareaId="my-textarea" onChange={onChange} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'new value' } });
    expect(onChange).toHaveBeenCalledWith('new value');
  });

  test('applies input-error class when invalid', () => {
    render(<Textarea value="" textareaId="my-textarea" invalid />);
    const textarea = screen.getByRole('textbox');
    expect(textarea.className).toMatch(/input-error/);
  });

  test('applies custom cssClass', () => {
    render(<Textarea value="" textareaId="my-textarea" cssClass="custom-class" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea.className).toMatch(/custom-class/);
  });

  test('is disabled when disabled prop is true', () => {
    render(<Textarea value="" textareaId="my-textarea" disabled />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });

  test('handles  number values', () => {
    render(<Textarea value={123} textareaId="my-textarea" />);
    expect(screen.getByRole('textbox')).toHaveValue('123');
  });

  test('handles null and number values', () => {
    render(<Textarea value={null} textareaId="my-textarea" />);
    expect(screen.getByRole('textbox')).toHaveValue('');
  });
});
