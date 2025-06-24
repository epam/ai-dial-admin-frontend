import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import PasswordInputField from './PasswordInputField';

describe('Common components - PasswordInputField', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(<PasswordInputField elementId="password" />);
    expect(baseElement).toBeTruthy();
  });
});
