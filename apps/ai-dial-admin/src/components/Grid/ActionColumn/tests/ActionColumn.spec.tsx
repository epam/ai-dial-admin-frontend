import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import ActionColumn from '../ActionColumn';
import ActionItem from '../ActionItem';

describe('ActionColumn', () => {
  const baseProps = {
    items: [
      { id: 'edit', hidden: undefined },
      { id: 'delete', hidden: () => false },
      { id: 'hidden', hidden: () => true },
    ],
    data: { name: 'entity1' },
    api: {},
    node: { rowIndex: 2 },
  };

  test('renders dropdown with visible items and ActionTrigger', () => {
    const { container } = render(<ActionColumn {...baseProps} />);

    expect(container.querySelector('.tabler-icon-dots')).toBeInTheDocument();
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  test('renders nothing if data is null', () => {
    const { container } = render(<ActionColumn {...baseProps} data={null} />);

    expect(container.querySelector('.tabler-icon-dots')).toBeNull();
  });
});

describe('ActionItem', () => {
  test('renders icon and id, calls onClick with entity and rowIndex', () => {
    const onClick = vi.fn();
    const item = {
      id: 'edit',
      icon: <span>icon</span>,
      onClick,
    };
    const entity = { name: 'entity1' };
    const rowIndex = 3;

    render(<ActionItem item={item} entity={entity} rowIndex={rowIndex} />);

    expect(screen.getByText('icon')).toBeInTheDocument();
    expect(screen.getByText('edit')).toBeInTheDocument();

    fireEvent.click(screen.getByText('edit').closest('div')!);
    expect(onClick).toHaveBeenCalledWith(entity, rowIndex);
  });
});
