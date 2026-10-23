import { fireEvent, render, screen } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { describe, expect, test, vi } from 'vitest';

import ColumnsPanel from '@/src/components/Grid/ColumnsPanel/ColumnsPanel';

const columns = [
  { field: 'name', headerName: 'Name', hide: false },
  { field: 'status', headerName: 'Status', hide: true },
];

const renderPanel = (toggleColumnVisibility = vi.fn()) =>
  render(
    <DndProvider backend={HTML5Backend}>
      <ColumnsPanel
        columns={columns}
        showResetButton={false}
        panelClassName=""
        onReset={vi.fn()}
        toggleColumnVisibility={toggleColumnVisibility}
      />
    </DndProvider>,
  );

describe('ColumnsPanel', () => {
  test('reflects column visibility in the checkboxes', () => {
    renderPanel();

    expect(screen.getByRole('checkbox', { name: 'Name' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Status' })).not.toBeChecked();
  });

  test('toggles the column whose checkbox was clicked', () => {
    const toggleColumnVisibility = vi.fn();
    renderPanel(toggleColumnVisibility);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Status' }));

    expect(toggleColumnVisibility).toHaveBeenCalledWith('status');
  });
});
