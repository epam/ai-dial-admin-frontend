import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColDef, ValueFormatterParams, ValueGetterParams } from 'ag-grid-community';
import { describe, expect, test, vi } from 'vitest';

import GroupsGrid, { GroupRow } from '@/src/components/Analytics/Pipelines/Groups/GroupsGrid';
import { GroupState } from '@/src/components/Analytics/Pipelines/Groups/models';
import { groupMock, NOW } from '@/src/components/Analytics/Pipelines/Groups/tests/mock';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { ReadyWhen } from '@/src/models/analytics/pipeline';

/**
 * ag-grid is replaced by a harness that renders each row through the column's own renderer or formatter, so the
 * cells under test are the real ones.
 */
vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ rowData, columnDefs, getIsEmptyData, emptyDataProps }: any) => {
    if (getIsEmptyData?.()) return <section aria-label="empty">{emptyDataProps?.title}</section>;

    const cell = (column: ColDef<GroupRow>, row: GroupRow) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (column.cellRenderer) return (column.cellRenderer as any)({ data: row });

      const getter = column.valueGetter as (params: ValueGetterParams<GroupRow>) => unknown;
      const value = getter({ data: row } as ValueGetterParams<GroupRow>);
      const formatter = column.valueFormatter as ((params: ValueFormatterParams) => string) | undefined;

      return formatter ? formatter({ value } as ValueFormatterParams) : String(value ?? '');
    };

    return (
      <table aria-label="grid">
        <thead>
          <tr>
            {columnDefs.map((column: ColDef) => (
              <th key={column.colId}>{column.headerName}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowData.map((row: GroupRow) => (
            <tr key={row.group.group_key} aria-label={row.group.group_key}>
              {columnDefs.map((column: ColDef<GroupRow>) => (
                <td key={column.colId}>{cell(column, row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  },
}));

const CEILING: ReadyWhen = { idle: '10m', cost_ceiling: 20 };

const renderGrid = (rows: GroupRow[], readyWhen: ReadyWhen = CEILING) => {
  const onQueue = vi.fn();

  render(
    <GroupsGrid
      rows={rows}
      readyWhen={readyWhen}
      isPaused={false}
      isBusy={false}
      isLoading={false}
      now={NOW}
      emptyMessage="nothing"
      onQueue={onQueue}
    />,
  );

  return onQueue;
};

const row = (key: string) => screen.getByRole('row', { name: key });
const queueControl = (key: string) =>
  within(row(key)).queryByRole('button', { name: AnalyticsPipelinesI18nKey.GroupsQueue });

describe('GroupsGrid', () => {
  test('states the empty message when there are no rows', () => {
    renderGrid([]);

    expect(screen.getByText('nothing')).toBeInTheDocument();
  });

  test('names every column and presents a group’s facts', () => {
    renderGrid([{ group: groupMock({ evaluations: 7 }), state: GroupState.Waiting }]);

    for (const header of [
      AnalyticsPipelinesI18nKey.GroupsColumnKey,
      AnalyticsPipelinesI18nKey.GroupsColumnState,
      AnalyticsPipelinesI18nKey.GroupsColumnLastActivity,
      AnalyticsPipelinesI18nKey.GroupsColumnLastEvaluated,
      AnalyticsPipelinesI18nKey.GroupsColumnEvaluations,
      AnalyticsPipelinesI18nKey.GroupsColumnActions,
    ]) {
      expect(screen.getByRole('columnheader', { name: header })).toBeInTheDocument();
    }

    expect(within(row('sess_A')).getByText(AnalyticsPipelinesI18nKey.GroupsNever)).toBeInTheDocument();
    expect(within(row('sess_A')).getByText('7 / 20')).toBeInTheDocument();
  });

  test('ends the group key cell with its copy control', () => {
    renderGrid([{ group: groupMock(), state: GroupState.Waiting }]);

    expect(
      within(row('sess_A')).getByRole('button', { name: `copy ${AnalyticsPipelinesI18nKey.GroupsColumnKey}` }),
    ).toBeInTheDocument();
  });

  test('states a bare count without a ceiling', () => {
    renderGrid([{ group: groupMock({ evaluations: 3 }), state: GroupState.Waiting }], { idle: '10m' });

    expect(within(row('sess_A')).getByText('3')).toBeInTheDocument();
  });

  test('reads a count recorded yesterday as zero', () => {
    renderGrid([{ group: groupMock({ evaluations: 20, evaluations_day: '2026-10-04' }), state: GroupState.Ready }]);

    expect(within(row('sess_A')).getByText('0 / 20')).not.toHaveClass('text-warning');
  });

  test('highlights a count at its ceiling with the warning colour', () => {
    renderGrid([{ group: groupMock({ evaluations: 20 }), state: GroupState.AtCap }]);

    expect(within(row('sess_A')).getByText('20 / 20')).toHaveClass('text-warning');
  });

  test('offers Queue evaluation on a waiting group and hands the group over', async () => {
    const user = userEvent.setup();
    const group = groupMock();
    const onQueue = renderGrid([{ group, state: GroupState.Waiting }]);

    await user.click(queueControl('sess_A') as HTMLElement);

    expect(onQueue).toHaveBeenCalledWith(group);
  });

  test('offers Queue evaluation on an up-to-date group', () => {
    renderGrid([{ group: groupMock({ dirty: false }), state: GroupState.UpToDate }]);

    expect(queueControl('sess_A')).toBeEnabled();
  });

  test('presents an at-cap control that stays focusable and does not operate', async () => {
    const user = userEvent.setup();
    const onQueue = renderGrid([{ group: groupMock({ evaluations: 20 }), state: GroupState.AtCap }]);

    const control = queueControl('sess_A') as HTMLElement;
    expect(control).toHaveAttribute('aria-disabled', 'true');
    expect(control).not.toBeDisabled();

    await user.click(control);
    expect(onQueue).not.toHaveBeenCalled();
  });

  test('holds back an up-to-date group that has spent today’s evaluations', () => {
    renderGrid([{ group: groupMock({ dirty: false, evaluations: 20 }), state: GroupState.UpToDate }]);

    expect(queueControl('sess_A')).toHaveAttribute('aria-disabled', 'true');
  });

  test('offers no control on a ready group', () => {
    renderGrid([{ group: groupMock(), state: GroupState.Ready }]);

    expect(queueControl('sess_A')).toBeNull();
  });
});
