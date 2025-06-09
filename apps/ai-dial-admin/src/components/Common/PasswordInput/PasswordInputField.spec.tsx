import { render } from '@testing-library/react';
import PasswordInputField from './PasswordInputField';

describe('Common components - PasswordInputField', () => {
  it('Should render successfully', () => {
    const { baseElement } = render(<PasswordInputField elementId="password" />);
    expect(baseElement).toBeTruthy();
  });
});
