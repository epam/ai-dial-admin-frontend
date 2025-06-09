import { render } from '@testing-library/react';
import LabeledText from './LabeledText';
describe('Common components - LabeledText', () => {
  it('Should render successfully', () => {
    const { baseElement } = render(<LabeledText label="label" text="text" />);
    expect(baseElement).toBeTruthy();
  });
});
