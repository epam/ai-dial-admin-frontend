import { ICellRendererParams } from 'ag-grid-community';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { GroupedGridRow } from '@/src/models/evaluation/test-case-grouping';

import TestCaseNameCellRenderer from '../TestCaseNameCellRenderer';
import { GridRowType } from '@/src/types/grid-row-type';

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialEllipsisTooltip: ({ text }: { text: string }) => <span>{text}</span>,
    DialTag: ({ label }: { label: string }) => <span>{label}</span>,
  };
});

type Props = ICellRendererParams<GroupedGridRow>;

const renderName = (data: GroupedGridRow, extra: Partial<Props> & { isReadonly?: boolean } = {}) =>
  render(<TestCaseNameCellRenderer {...({ data, value: data.testCaseName, ...extra } as Props)} />);

const groupRow: GroupedGridRow = {
  id: 'case-1',
  rowType: GridRowType.GROUP,
  groupKey: 'case-1',
  testCaseName: 'Case A',
  turnCount: 3,
};

describe('TestCaseNameCellRenderer', () => {
  test('should render an editable case name plus the turn-count badge on a GROUP row', () => {
    renderName(groupRow);

    expect(screen.getByRole('textbox')).toHaveValue('Case A');
    expect(screen.getByText(TestSuitesI18nKey.TurnCountBadge)).toBeInTheDocument();
  });

  test('should report a group name edit through onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderName(groupRow, { onChange, colDef: { field: 'testCaseName' } } as Partial<Props>);

    await user.type(screen.getByRole('textbox'), '!');

    expect(onChange).toHaveBeenCalledWith('Case A!', groupRow, 'testCaseName', undefined);
  });

  test('should render the group name as plain text with no input when read only', () => {
    renderName(groupRow, { isReadonly: true });

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('Case A')).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.TurnCountBadge)).toBeInTheDocument();
  });

  test('should render only the Turn N label on a TURN row nested under its GROUP row', () => {
    renderName({ id: 'case-1', rowType: GridRowType.TURN, groupKey: 'case-1', turnNumber: 2 });

    expect(screen.getByText(TestSuitesI18nKey.TurnLabel)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  test('should render the editable case name alongside the Turn N label on a flattened TURN row', () => {
    renderName({
      id: 'case-1',
      rowType: GridRowType.TURN,
      groupKey: 'case-1',
      testCaseName: 'Case A',
      turnNumber: 2,
      isFlattened: true,
    });

    expect(screen.getByRole('textbox')).toHaveValue('Case A');
    expect(screen.getByText(TestSuitesI18nKey.TurnLabel)).toBeInTheDocument();
  });

  test('should report a flattened turn name edit through onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const flattenedTurn: GroupedGridRow = {
      id: 'case-1',
      rowType: GridRowType.TURN,
      groupKey: 'case-1',
      testCaseName: 'Case A',
      turnNumber: 2,
      isFlattened: true,
    };
    renderName(flattenedTurn, { onChange, colDef: { field: 'testCaseName' } } as Partial<Props>);

    await user.type(screen.getByRole('textbox'), '!');

    expect(onChange).toHaveBeenCalledWith('Case A!', flattenedTurn, 'testCaseName', undefined);
  });

  test('should render nothing on a SINGLE row', () => {
    const { container } = renderName({ id: 'case-1', rowType: GridRowType.SINGLE, groupKey: 'case-1' });

    expect(container.firstChild).toBeNull();
  });
});
