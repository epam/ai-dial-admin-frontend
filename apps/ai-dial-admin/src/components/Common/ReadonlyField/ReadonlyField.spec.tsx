import ReadonlyField from './ReadonlyField';
import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import { describe, expect, test } from 'vitest';

describe('Common components - ReadonlyField', () => {
  test('Should render successfully', () => {
    const { baseElement } = renderWithContext(<ReadonlyField title="title" value="value" />);

    expect(baseElement).toBeTruthy();
  });
});
