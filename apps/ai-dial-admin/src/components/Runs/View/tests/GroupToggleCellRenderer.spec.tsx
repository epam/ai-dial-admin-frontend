import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ICellRendererParams } from 'ag-grid-community';
import { describe, expect, test, vi } from 'vitest';

import { ExtractionRowType, GroupedResultRow, TestCaseGroupRow } from '@/src/components/Runs/models';
import { RunsI18nKey } from '@/src/constants/i18n';
import GroupToggleCellRenderer from '../GroupToggleCellRenderer';

const groupRow = (overrides: Partial<TestCaseGroupRow> = {}): TestCaseGroupRow => ({
  rowType: ExtractionRowType.Group,
  groupKey: 'tc-1',
  testCaseName: 'test-weather',
  isExpanded: true,
  ...overrides,
});

const resultRow: GroupedResultRow = {
  rowType: ExtractionRowType.Result,
  groupKey: 'tc-1',
  id: 'r1',
  testCaseName: 'test-weather',
  responseStatusCode: 200,
  runIndex: 0,
};

const renderCell = (
  data: unknown,
  onToggleGroup?: (groupKey: string) => void,
  onRowClick?: () => void,
  consumeFocusRequest?: (groupKey: string) => boolean,
) =>
  render(
    <div onClick={onRowClick}>
      {/* The toggle column has no field, so the grid hands the renderer a row and no `value`. */}
      <GroupToggleCellRenderer
        {...({ data, value: undefined } as unknown as ICellRendererParams)}
        onToggleGroup={onToggleGroup}
        consumeFocusRequest={consumeFocusRequest}
      />
    </div>,
  );

describe('GroupToggleCellRenderer — group row', () => {
  test('exposes the group by the name of its test case', () => {
    renderCell(groupRow());

    expect(screen.getByRole('group', { name: 'test-weather' })).toBeInTheDocument();
  });

  test('offers to collapse an expanded group and reports it as expanded', () => {
    renderCell(groupRow({ isExpanded: true }));

    const button = screen.getByRole('button', { name: RunsI18nKey.CollapseTestCaseGroup });
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  test('offers to expand a collapsed group and reports it as not expanded', () => {
    renderCell(groupRow({ isExpanded: false }));

    const button = screen.getByRole('button', { name: RunsI18nKey.ExpandTestCaseGroup });
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  test('toggles its group when the button is clicked', async () => {
    const onToggleGroup = vi.fn();
    renderCell(groupRow(), onToggleGroup);

    await userEvent.setup().click(screen.getByRole('button', { name: RunsI18nKey.CollapseTestCaseGroup }));

    expect(onToggleGroup).toHaveBeenCalledOnce();
    expect(onToggleGroup).toHaveBeenCalledWith('tc-1');
  });

  test.each([
    ['Enter', '{Enter}'],
    ['Space', ' '],
  ])('toggles its group when %s is pressed on the focused button', async (_name, keys) => {
    const onToggleGroup = vi.fn();
    const user = userEvent.setup();
    renderCell(groupRow(), onToggleGroup);

    await user.tab();
    await user.keyboard(keys);

    expect(onToggleGroup).toHaveBeenCalledOnce();
    expect(onToggleGroup).toHaveBeenCalledWith('tc-1');
  });

  test('does not let the click reach the row', async () => {
    const onRowClick = vi.fn();
    renderCell(groupRow(), vi.fn(), onRowClick);

    await userEvent.setup().click(screen.getByRole('button', { name: RunsI18nKey.CollapseTestCaseGroup }));

    expect(onRowClick).not.toHaveBeenCalled();
  });

  test('does not fail when no toggle callback is given', async () => {
    renderCell(groupRow());

    await userEvent.setup().click(screen.getByRole('button', { name: RunsI18nKey.CollapseTestCaseGroup }));

    expect(screen.getByRole('group', { name: 'test-weather' })).toBeInTheDocument();
  });
});

describe('GroupToggleCellRenderer — focus restore', () => {
  test('asks about its own group and takes focus when the request is for it', () => {
    const consumeFocusRequest = vi.fn().mockReturnValue(true);

    renderCell(groupRow({ groupKey: 'tc-1' }), vi.fn(), undefined, consumeFocusRequest);

    expect(consumeFocusRequest).toHaveBeenCalledWith('tc-1');
    expect(screen.getByRole('button', { name: RunsI18nKey.CollapseTestCaseGroup })).toHaveFocus();
  });

  test('leaves focus alone when the request is for another group', () => {
    renderCell(groupRow({ groupKey: 'tc-1' }), vi.fn(), undefined, vi.fn().mockReturnValue(false));

    expect(screen.getByRole('button', { name: RunsI18nKey.CollapseTestCaseGroup })).not.toHaveFocus();
  });

  test('leaves focus alone when no callback is given', () => {
    renderCell(groupRow());

    expect(screen.getByRole('button', { name: RunsI18nKey.CollapseTestCaseGroup })).not.toHaveFocus();
  });
});

describe('GroupToggleCellRenderer — result row', () => {
  test('renders nothing, with no button and no group', () => {
    renderCell(resultRow);

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('group')).toBeNull();
  });

  test('does not consume a focus request', () => {
    const consumeFocusRequest = vi.fn().mockReturnValue(true);

    renderCell(resultRow, vi.fn(), undefined, consumeFocusRequest);

    expect(consumeFocusRequest).not.toHaveBeenCalled();
  });
});
