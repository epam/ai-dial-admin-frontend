import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import DraggableItem from './DraggableItem';

vi.mock('react-dnd', () => ({
  useDrag: () => [{ isDragging: true }, vi.fn(), vi.fn()],
  useDrop: () => [vi.fn(), vi.fn()],
}));

vi.mock('@tabler/icons-react', () => ({
  IconGripVertical: () => <span>GripIcon</span>,
}));

describe('Common components :: DraggableItem', () => {
  test('Should render children and grip icon', () => {
    render(
      <DraggableItem id="item-1">
        <span>ChildContent</span>
      </DraggableItem>,
    );
    expect(screen.getByText('GripIcon')).toBeInTheDocument();
    expect(screen.getByText('ChildContent')).toBeInTheDocument();
  });
});
