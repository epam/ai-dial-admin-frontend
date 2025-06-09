import RolesList from './RolesList';
import RolesView from './RolesView';
import { renderWithContext } from '@/src/utils/tests/renderWithContext';

jest.mock('react-dnd', () => ({
  useDrag: () => [{ isDragging: false }, jest.fn()],
  useDrop: () => [{ isOver: false }, jest.fn()],
}));

describe('RolesList - List view', () => {
  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(<RolesList data={[{ name: '' }]} />);
    expect(baseElement).toBeTruthy();
  });
});

describe('RolesView - view', () => {
  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(
      <RolesView names={[]} originalRole={{}} addons={[]} applications={[]} keys={[]} models={[]} />,
    );
    expect(baseElement).toBeTruthy();
  });
});
