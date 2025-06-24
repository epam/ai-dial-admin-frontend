import Menu from './Menu';
import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import { describe, expect, test, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => 'en',
  useRouter: () => [],
}));

describe('Menu', () => {
  test('Should render successfully', () => {
    const { baseElement } = renderWithContext(<Menu disableMenuItems={[]} />);
    expect(baseElement).toBeTruthy();
  });
});
