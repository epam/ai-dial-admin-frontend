import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import { describe, expect, test, vi } from 'vitest';
import Paths from './Paths';

describe('Roles :: Paths', () => {
  test('Should render successfully', () => {
    const { baseElement } = renderWithContext(<Paths route={{ paths: ['path1', 'path2'] }} updateRoute={vi.fn()} />);
    expect(baseElement).toBeTruthy();
  });
});
