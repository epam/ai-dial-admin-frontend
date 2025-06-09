import { render } from '@testing-library/react';
import DraggableItem from './DraggableItem';

jest.mock('react-dnd', () => ({
  useDrag: () => [{ isDragging: false }, jest.fn(), jest.fn()],
  useDrop: () => [{ isOver: false }, jest.fn()],
}));

describe('Common components - DraggableItem', () => {
  it('Should render successfully', () => {
    const { baseElement } = render(
      <DraggableItem id="draggable">
        <div></div>
      </DraggableItem>,
    );
    expect(baseElement).toBeTruthy();
  });
});
