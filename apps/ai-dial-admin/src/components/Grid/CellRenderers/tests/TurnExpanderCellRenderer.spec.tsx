import { ICellRendererParams } from 'ag-grid-community';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { GridRowType, GroupedGridRow } from '@/src/models/evaluation/test-case-grouping';

import TurnExpanderCellRenderer from '../TurnExpanderCellRenderer';

type Props = ICellRendererParams<GroupedGridRow> & { onToggleExpand?: (groupKey: string) => void };

const renderExpander = (data: GroupedGridRow | undefined, onToggleExpand?: (groupKey: string) => void) =>
  render(<TurnExpanderCellRenderer {...({ data, onToggleExpand } as Props)} />);

const groupRow = (overrides: Partial<GroupedGridRow> = {}): GroupedGridRow => ({
  id: 'case-1',
  rowType: GridRowType.GROUP,
  groupKey: 'case-1',
  expanded: false,
  ...overrides,
});

const turnRow = (overrides: Partial<GroupedGridRow> = {}): GroupedGridRow => ({
  id: 'case-1',
  rowType: GridRowType.TURN,
  groupKey: 'case-1',
  turnNumber: 1,
  ...overrides,
});

const singleRow = (overrides: Partial<GroupedGridRow> = {}): GroupedGridRow => ({
  id: 'case-1',
  rowType: GridRowType.SINGLE,
  groupKey: 'case-1',
  ...overrides,
});

describe('TurnExpanderCellRenderer', () => {
  test('should render a collapsed chevron on a GROUP row with an Expand turns aria-label', () => {
    renderExpander(groupRow());

    expect(screen.getByRole('button', { name: 'Expand turns' })).toBeInTheDocument();
  });

  test('should render an expanded chevron on a GROUP row with a Collapse turns aria-label', () => {
    renderExpander(groupRow({ expanded: true }));

    expect(screen.getByRole('button', { name: 'Collapse turns' })).toBeInTheDocument();
  });

  test('should call onToggleExpand with the group key when the chevron is clicked', () => {
    const onToggleExpand = vi.fn();
    renderExpander(groupRow(), onToggleExpand);

    fireEvent.click(screen.getByRole('button', { name: 'Expand turns' }));

    expect(onToggleExpand).toHaveBeenCalledWith('case-1');
  });

  test('should stop propagation on click so a parent row handler does not also fire', () => {
    const onToggleExpand = vi.fn<(groupKey: string) => void>();
    const onParentClick = vi.fn();
    const props: Partial<Props> = { data: groupRow(), onToggleExpand };

    render(
      <div onClick={onParentClick}>
        <TurnExpanderCellRenderer {...(props as Props)} />
      </div>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Expand turns' }));

    expect(onToggleExpand).toHaveBeenCalledTimes(1);
    expect(onParentClick).not.toHaveBeenCalled();
  });

  test('should render an indent bullet on a TURN row with no expand affordance', () => {
    const { container } = renderExpander(turnRow());

    expect(container.querySelector('.rounded-full')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('should render nothing on a SINGLE row', () => {
    const { container } = renderExpander(singleRow());

    expect(container.firstChild).toBeNull();
  });
});
