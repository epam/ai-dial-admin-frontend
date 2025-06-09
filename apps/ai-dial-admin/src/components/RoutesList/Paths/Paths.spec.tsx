import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import Paths from './Paths';

describe('Roles :: Paths', () => {
  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(<Paths route={{ paths: ['path1', 'path2'] }} updateRoute={jest.fn()} />);
    expect(baseElement).toBeTruthy();
  });
});
