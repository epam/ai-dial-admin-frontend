import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import RangeSlider from './RangeSlider';
import { vi } from 'vitest';

describe('RangeSlider', () => {
  test('renders with title and initial value', () => {
    render(<RangeSlider title="Volume" initialValue={30} onChange={vi.fn()} />);
    expect(screen.getByText('Volume')).toBeInTheDocument();
    // Find the input of type range and check its value
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveValue('30');
  });

  test('calls onChange when slider value changes', () => {
    const onChange = vi.fn();
    render(<RangeSlider title="Brightness" initialValue={20} onChange={onChange} />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '40' } });
    expect(onChange).toHaveBeenCalledWith(40);
    expect(slider).toHaveValue('40');
  });

  test('shows formatted value if valueFormatter is provided', () => {
    render(<RangeSlider title="Custom" initialValue={10} onChange={vi.fn()} valueFormatter={(v) => v * 2} />);
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  test('uses min and max props', () => {
    render(<RangeSlider title="MinMax" initialValue={5} min={1} max={9} onChange={vi.fn()} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '1');
    expect(slider).toHaveAttribute('max', '9');
  });
});
