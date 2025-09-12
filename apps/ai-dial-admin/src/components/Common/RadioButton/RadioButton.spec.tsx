import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RadioButton from './RadioButton';

describe('RadioButton', () => {
  it('renders with title', () => {
    render(<RadioButton inputId="radio1" title="Option 1" />);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByRole('radio')).toBeInTheDocument();
  });

  it('renders description when checked', () => {
    render(<RadioButton inputId="radio2" title="Option 2" description="Desc" checked />);
    expect(screen.getByText('Desc')).toBeInTheDocument();
  });

  it('does not render description when not checked', () => {
    render(<RadioButton inputId="radio3" title="Option 3" description="Desc" checked={false} />);
    expect(screen.queryByText('Desc')).not.toBeInTheDocument();
  });

  it('calls onChange with title when changed', () => {
    const onChange = vi.fn();
    render(<RadioButton inputId="radio4" title="Option 4" onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio'));
    expect(onChange).toHaveBeenCalledWith('Option 4');
  });

  it('calls onChange with empty string if no title', () => {
    const onChange = vi.fn();
    render(<RadioButton inputId="radio5" onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio'));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('is disabled when disabled prop is true', () => {
    render(<RadioButton inputId="radio6" title="Disabled" disabled />);
    expect(screen.getByRole('radio')).toBeDisabled();
  });
});
