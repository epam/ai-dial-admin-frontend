import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import RadioGroup from './RadioGroup';
import { RadioFieldOrientation } from '@/src/types/radio-orientation';

describe('Common :: RadioGroup', () => {
  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(
      <RadioGroup
        elementId="radioGroup"
        onChange={jest.fn()}
        orientation={RadioFieldOrientation.Row}
        activeRadioButton="activeRadioButton"
        radioButtons={[]}
        fieldTitle="title"
      />,
    );
    expect(baseElement).toBeTruthy();
  });
});
