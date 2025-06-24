import { fireEvent, render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { NumberInputField } from './InputField';

describe('Common components - NumberInputField', () => {
  test('Should render successfully', () => {
    let value = 1;
    const onChange = (v: number) => {
      value = v;
    };
    const { baseElement, getByTestId } = render(
      <NumberInputField value={value} elementId="numberField" onChange={onChange} />,
    );

    expect(baseElement).toBeTruthy();
    const control = getByTestId('numberField');
    expect(value).toBe(1);
    fireEvent.change(control, { target: { value: 2 } });
    expect(value).toBe(2);
  });
});
