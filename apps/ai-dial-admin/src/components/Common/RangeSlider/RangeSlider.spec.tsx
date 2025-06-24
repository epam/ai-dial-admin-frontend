import { fireEvent, render } from '@testing-library/react';
import RangeSlider from './RangeSlider';
import { describe, expect, test, vi } from 'vitest';

describe('Common components :: RangeSlider', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(<RangeSlider title="range" onChange={vi.fn()} />);

    expect(baseElement).toBeTruthy();
  });

  test('Should render successfully with formatter', () => {
    let rangeValue: number | null = null;
    const onChange = (v: number) => {
      rangeValue = v;
    };

    const { baseElement, getByTestId } = render(
      <RangeSlider title="range" onChange={onChange} valueFormatter={(v) => v * 10} />,
    );

    expect(baseElement).toBeTruthy();
    expect(rangeValue).toBeNull();

    const range = getByTestId('range-selector');
    fireEvent.change(range, { target: { value: 4 } });

    expect(rangeValue).toBe(4);
  });
});
