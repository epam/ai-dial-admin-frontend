import Menu from './Menu';
import { render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => 'en',
  useRouter: () => [],
}));

describe('Menu', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(<Menu disableMenuItems={[]} />);
    expect(baseElement).toBeTruthy();
  });
});
