import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  test('renders the operation as a button named after it', () => {
    renderCell({
      icon,
      id: 'try',
      label: 'Try_out',
      onClick: vi.fn(),
    });

    expect(screen.getByRole('button', { name: 'Try_out' })).toBeTruthy();
    expect(screen.getByText('icon')).toBeTruthy();
  });

  test('invokes the operation on click with the row data and index', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderCell({ icon, id: 'try', label: 'Try_out', onClick });

    await user.click(screen.getByRole('button', { name: 'Try_out' }));

    expect(onClick).toHaveBeenCalledWith({ id: '1' }, 0);
  });

  test('invokes the operation from the keyboard', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderCell({ icon, id: 'try', label: 'Try_out', onClick });

    await user.tab();
    await user.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalledWith({ id: '1' }, 0);
  });

  test('returns null when hidden is true', () => {
    const { container } = renderCell({
      icon,
      id: 'try',
      label: 'Try_out',
      onClick: vi.fn(),
      hidden: () => true,
    });

    expect(container.firstChild).toBeNull();
  });
});
