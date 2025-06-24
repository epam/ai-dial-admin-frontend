import { render } from '@testing-library/react';
import RadioGroup from './RadioGroup';
import { RadioFieldOrientation } from '@/src/types/radio-orientation';
import { describe, expect, test, vi } from 'vitest';

describe('Common :: RadioGroup', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(
      <RadioGroup
        elementId="radioGroup"
        onChange={vi.fn()}
        orientation={RadioFieldOrientation.Row}
        activeRadioButton="activeRadioButton"
        radioButtons={[]}
        fieldTitle="title"
      />,
    );
    expect(baseElement).toBeTruthy();
  });
});
