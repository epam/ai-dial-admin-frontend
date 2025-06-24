import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import RadioButton from './RadioButton';

describe('Common components - RadioButton', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(<RadioButton inputId="radio" title="radio-title" />);

    expect(baseElement).toBeTruthy();
  });

  test('Should render successfully disabled radio button', () => {
    const { baseElement } = render(<RadioButton inputId="radio" title="radio-title" disabled={true} />);

    expect(baseElement).toBeTruthy();
  });
});
