import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import ActionColumn from '../ActionColumn';

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
