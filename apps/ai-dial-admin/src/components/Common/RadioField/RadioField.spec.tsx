import { render } from '@testing-library/react';
import RadioField from './RadioField';
import { RadioFieldOrientation } from '@/src/types/radio-orientation';

describe('Common components - RadioField', () => {
  it('Should render column orientation successfully', () => {
    const { baseElement } = render(
      <RadioField
        elementId="radio"
        radioButtons={[]}
        activeRadioButton="1"
        fieldTitle="fieldTitle"
        onChange={jest.fn()}
        orientation={RadioFieldOrientation.Column}
      />,
    );

    expect(baseElement).toBeTruthy();
  });

  it('Should render row orientation successfully', () => {
    const { baseElement } = render(
      <RadioField
        fieldTitle="fieldTitle"
        elementId="radio"
        radioButtons={[]}
        activeRadioButton="1"
        onChange={jest.fn()}
        orientation={RadioFieldOrientation.Row}
      />,
    );

    expect(baseElement).toBeTruthy();
  });
});
