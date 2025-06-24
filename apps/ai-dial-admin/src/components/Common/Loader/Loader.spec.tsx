import { render } from '@testing-library/react';
import Loader from './Loader';
import { describe, expect, test } from 'vitest';

describe('Common components - Loader', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(<Loader />);
    expect(baseElement).toBeTruthy();
  });
});
