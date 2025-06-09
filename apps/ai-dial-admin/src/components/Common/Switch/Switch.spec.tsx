import { fireEvent, render } from '@testing-library/react';
import Switch from './Switch';

describe('Common components - Switch', () => {
  it('Should render successfully', () => {
    const { baseElement } = render(<Switch switchId="switch" title="AAA" isOn={true} />);

    expect(baseElement).toBeTruthy();
  });

  it('Should check OnChange', () => {
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
