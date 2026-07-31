import { ICellRendererParams } from 'ag-grid-community';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { GridRowType, GroupedGridRow, TestCaseRow } from '@/src/models/evaluation/test-case-grouping';

import StackedTurnsCellRenderer from '../StackedTurnsCellRenderer';

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialEllipsisTooltip: ({ text }: { text: string }) => <span>{text}</span>,
  };
});

type Props = ICellRendererParams<GroupedGridRow>;

const renderStacked = (data: GroupedGridRow, field = 'note') =>
  render(<StackedTurnsCellRenderer {...({ data, colDef: { field } } as Props)} />);

const groupRow = (turns: TestCaseRow[], expanded = false): GroupedGridRow => ({
  id: 'case-1',
  rowType: GridRowType.GROUP,
  groupKey: 'case-1',
  turns,
  turnCount: turns.length,
  expanded,
});

describe('StackedTurnsCellRenderer', () => {
  test('should render one line per turn on a collapsed GROUP row', () => {
    renderStacked(
      groupRow([
        { id: 'case-1', data: { note: 'first' } },
        { id: 'case-1', data: { note: 'second' } },
        { id: 'case-1', data: { note: 'third' } },
      ]),
    );

    expect(screen.getByText('first')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
    expect(screen.getByText('third')).toBeInTheDocument();
  });

  test('should render null when the group is expanded', () => {
    const { container } = renderStacked(groupRow([{ id: 'case-1', data: { note: 'first' } }], true));

    expect(container.firstChild).toBeNull();
  });

  test('should render an em dash for an empty or absent turn value', () => {
    renderStacked(
      groupRow([
        { id: 'case-1', data: {} },
        { id: 'case-2', data: { note: '' } },
      ]),
    );

    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  test("should read a turn's value from its data map, falling back to the flattened row field", () => {
    renderStacked(
      groupRow([
        { id: 'case-1', data: { note: 'from-data-map' } },
        { id: 'case-1', note: 'flattened-fallback' },
      ]),
    );

    expect(screen.getByText('from-data-map')).toBeInTheDocument();
    expect(screen.getByText('flattened-fallback')).toBeInTheDocument();
  });
});
