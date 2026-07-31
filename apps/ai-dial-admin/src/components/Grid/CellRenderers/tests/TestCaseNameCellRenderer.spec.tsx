import { ICellRendererParams } from 'ag-grid-community';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { GridRowType, GroupedGridRow } from '@/src/models/evaluation/test-case-grouping';

import TestCaseNameCellRenderer from '../TestCaseNameCellRenderer';

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialEllipsisTooltip: ({ text }: { text: string }) => <span>{text}</span>,
    DialTag: ({ label }: { label: string }) => <span>{label}</span>,
  };
});

type Props = ICellRendererParams<GroupedGridRow>;

const renderName = (data: GroupedGridRow) => render(<TestCaseNameCellRenderer {...({ data } as Props)} />);

describe('TestCaseNameCellRenderer', () => {
  test('should render the case name plus the turn-count badge on a GROUP row', () => {
    renderName({
      id: 'case-1',
      rowType: GridRowType.GROUP,
      groupKey: 'case-1',
      testCaseName: 'Case A',
      turnCount: 3,
    });

    expect(screen.getByText('Case A')).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.TurnCountBadge)).toBeInTheDocument();
  });

  test('should render the Turn N label on a TURN row', () => {
    renderName({ id: 'case-1', rowType: GridRowType.TURN, groupKey: 'case-1', turnNumber: 2 });

    expect(screen.getByText(TestSuitesI18nKey.TurnLabel)).toBeInTheDocument();
  });

  test('should render nothing on a SINGLE row', () => {
    const { container } = renderName({ id: 'case-1', rowType: GridRowType.SINGLE, groupKey: 'case-1' });

    expect(container.firstChild).toBeNull();
  });
});
