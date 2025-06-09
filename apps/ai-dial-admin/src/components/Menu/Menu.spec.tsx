import Menu from './Menu';
import { renderWithContext } from '@/src/utils/tests/renderWithContext';

jest.mock('next/navigation', () => ({
  usePathname: () => 'en',
  useRouter: () => [],
}));

describe('Menu', () => {
  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(<Menu disableMenuItems={[]} />);
    expect(baseElement).toBeTruthy();
  });
});
