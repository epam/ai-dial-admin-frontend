import { render } from '@testing-library/react';
import Pricing from './Pricing';
import { describe, expect, test, vi } from 'vitest';

describe('Pricing', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(<Pricing model={{}} onChangeModel={vi.fn()} />);
    expect(baseElement).toBeTruthy();
  });
});
