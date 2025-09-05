import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Switch from './Switch';

describe('Switch', () => {
  it('renders with title', () => {
    render(<Switch title="Test Switch" switchId="switch1" />);
    expect(screen.getByText('Test Switch')).toBeInTheDocument();
  });

  it('calls onChange with toggled value', () => {
    const onChange = vi.fn();
    render(<Switch title="Test Switch" switchId="switch2" isOn={false} onChange={onChange} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('is disabled when disabled prop is true', () => {
    const onChange = vi.fn();
    render(<Switch title="Disabled Switch" switchId="switch3" disabled onChange={onChange} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });
});
