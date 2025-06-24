import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import LabeledText from './LabeledText';

describe('Common components - LabeledText', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(<LabeledText label="label" text="text" />);
    expect(baseElement).toBeTruthy();
  });
});
