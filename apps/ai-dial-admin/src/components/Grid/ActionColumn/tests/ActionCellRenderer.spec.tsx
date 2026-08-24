import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CustomCellRendererProps } from 'ag-grid-react';

import ActionCellRenderer from '../ActionCellRenderer';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';

const icon = <span>icon</span>;

type Row = { id: string };

const renderCell = (item: ActionMenuOperationDeclaration<Row>, data: Row | undefined = { id: '1' }) =>
  render(
    <ActionCellRenderer
      {...({
        item,
        data,
        api: {},
        node: { rowIndex: 0 },
      } as CustomCellRendererProps<Row> & { item: ActionMenuOperationDeclaration<Row> })}
    />,
  );

describe('ActionCellRenderer', () => {
  test('renders the icon when data is present and not hidden', () => {
    renderCell({
      icon,
      id: 'try',
      onClick: vi.fn(),
    });

    expect(screen.getByText('icon')).toBeInTheDocument();
  });

  test('returns null when hidden is true', () => {
    const { container } = renderCell({
      icon,
      id: 'try',
      onClick: vi.fn(),
      hidden: () => true,
    });

    expect(container.firstChild).toBeNull();
  });
});
