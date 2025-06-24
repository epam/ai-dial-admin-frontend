import { render } from '@testing-library/react';
import RadioField from './RadioField';
import { RadioFieldOrientation } from '@/src/types/radio-orientation';
import { describe, expect, test, vi } from 'vitest';

describe('Common components - RadioField', () => {
  test('Should render column orientation successfully', () => {
    const { baseElement } = render(
      <RadioField
        elementId="radio"
        radioButtons={[]}
        activeRadioButton="1"
        fieldTitle="fieldTitle"
        onChange={vi.fn()}
        orientation={RadioFieldOrientation.Column}
      />,
    );

    expect(baseElement).toBeTruthy();
  });

  test('Should render row orientation successfully', () => {
    const { baseElement } = render(
      <RadioField
        fieldTitle="fieldTitle"
        elementId="radio"
        radioButtons={[]}
        activeRadioButton="1"
        onChange={vi.fn()}
        orientation={RadioFieldOrientation.Row}
      />,
    );

    expect(baseElement).toBeTruthy();
  });
});
