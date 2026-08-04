import { ICellRendererParams } from 'ag-grid-community';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { GridRowType, GroupedGridRow } from '@/src/models/evaluation/test-case-grouping';

import TurnIdCellRenderer from '../TurnIdCellRenderer';

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialEllipsisTooltip: ({ text }: { text: string }) => <span>{text}</span>,
  };
});

type Props = ICellRendererParams<GroupedGridRow>;

const renderId = (data: GroupedGridRow) => render(<TurnIdCellRenderer {...({ data } as Props)} />);

describe('TurnIdCellRenderer', () => {
  test('should render the case id on a GROUP row', () => {
    renderId({ id: 'case-1', rowType: GridRowType.GROUP, groupKey: 'case-1' });

    expect(screen.getByText('case-1')).toBeInTheDocument();
  });

  test('should render the case id on a SINGLE row', () => {
    renderId({ id: 'case-1', rowType: GridRowType.SINGLE, groupKey: 'case-1' });

    expect(screen.getByText('case-1')).toBeInTheDocument();
  });

  test('should render blank on a TURN row nested under its GROUP row', () => {
    const { container } = renderId({ id: 'case-1', rowType: GridRowType.TURN, groupKey: 'case-1', turnNumber: 1 });

    expect(container.firstChild).toBeNull();
  });

  test('should render the case id on a flattened TURN row, which has no GROUP row above it', () => {
    renderId({
      id: 'case-1',
      rowType: GridRowType.TURN,
      groupKey: 'case-1',
      turnNumber: 1,
      isFlattened: true,
    });

    expect(screen.getByText('case-1')).toBeInTheDocument();
  });
});
