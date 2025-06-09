import { render } from '@testing-library/react';
import RadioButton from './RadioButton';

describe('Common components - RadioButton', () => {
  it('Should render successfully', () => {
    const { baseElement } = render(<RadioButton inputId="radio" title="radio-title" />);

    expect(baseElement).toBeTruthy();
  });

  it('Should render successfully disabled radio button', () => {
    const { baseElement } = render(<RadioButton inputId="radio" title="radio-title" disabled={true} />);

    expect(baseElement).toBeTruthy();
  });
});
