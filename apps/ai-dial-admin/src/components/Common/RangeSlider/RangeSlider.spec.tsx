import { fireEvent, render } from '@testing-library/react';
import RangeSlider from './RangeSlider';

describe('Common components :: RangeSlider', () => {
  it('Should render successfully', () => {
    const { baseElement } = render(<RangeSlider title="range" onChange={jest.fn()} />);

    expect(baseElement).toBeTruthy();
  });

  it('Should render successfully with formatter', () => {
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
