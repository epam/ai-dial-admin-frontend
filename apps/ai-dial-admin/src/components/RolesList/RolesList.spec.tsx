import RolesList from './RolesList';
import RolesView from './RolesView';
import { render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('react-dnd', () => ({
  useDrag: () => [{ isDragging: false }, vi.fn()],
  useDrop: () => [{ isOver: false }, vi.fn()],
}));

describe('RolesList - List view', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(<RolesList data={[{ name: '' }]} />);
    expect(baseElement).toBeTruthy();
  });
});

describe('RolesView - view', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(
      <RolesView names={[]} originalRole={{}} addons={[]} applications={[]} keys={[]} models={[]} />,
    );
    expect(baseElement).toBeTruthy();
  });
});
