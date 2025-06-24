import ReadonlyField from './ReadonlyField';
import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

describe('Common components - ReadonlyField', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(<ReadonlyField title="title" value="value" />);

    expect(baseElement).toBeTruthy();
  });
});
