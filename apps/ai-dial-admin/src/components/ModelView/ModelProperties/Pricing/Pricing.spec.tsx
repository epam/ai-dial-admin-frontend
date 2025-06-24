import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import Pricing from './Pricing';
import { describe, expect, test, vi } from 'vitest';

describe('Pricing', () => {
  test('Should render successfully', () => {
    const { baseElement } = renderWithContext(<Pricing model={{}} onChangeModel={vi.fn()} />);
    expect(baseElement).toBeTruthy();
  });
});
