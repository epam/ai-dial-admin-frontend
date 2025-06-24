import { fireEvent, render } from '@testing-library/react';
import Switch from './Switch';
import { describe, expect, test } from 'vitest';

describe('Common components - Switch', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(<Switch switchId="switch" title="AAA" isOn={true} />);

    expect(baseElement).toBeTruthy();
  });

  test('Should check OnChange', () => {
    let value = false;
    const onChange = (v: boolean) => {
      value = v;
    };

    const { baseElement } = render(<Switch switchId="switch" title="AAA" isOn={value} onChange={onChange} />);
    const input = baseElement.getElementsByTagName('input')[0];

    expect(input).toBeTruthy();
    expect(input.checked).toBeFalsy();
    fireEvent.click(input);
    expect(value).toBeTruthy();
  });
});
