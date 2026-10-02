import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import BreakdownTable from '@/src/components/Analytics/Usage/Breakdown/BreakdownTable';
import {
  BreakdownRow,
  BreakdownRowModel,
  BreakdownTab,
  RequestState,
  RouteKind,
  SpendColumn,
  UsageView,
} from '@/src/components/Analytics/Usage/models';
import { VIEW_BREAKDOWN_TABS } from '@/src/components/Analytics/Usage/constants';
import { EMPTY_MEASURES } from '@/src/components/Analytics/Usage/utils/folds';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';
import { QueryOutcome } from '@/src/components/Analytics/Common/use-analytics-query';

interface CapturedGrid {
  /** Absent on the dialog's grid, which reads its rows through a datasource instead. */
  rowData?: BreakdownRowModel[];
  columnDefs: { colId?: string; filter?: boolean | string; tooltipValueGetter?: () => unknown }[];
}

const RUNNER = {
  runQuery: vi.fn(async (): Promise<QueryOutcome> => ({ isSuccess: true, result: { rows: [] } })),
  runSql: vi.fn(),
};
vi.mock('@/src/components/Analytics/Common/use-analytics-query', () => ({
  useAnalyticsQuery: () => RUNNER,
}));

const grids: CapturedGrid[] = [];

// AG Grid is the heavy child; this spec is about the rows and columns handed to it.
vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: (props: CapturedGrid) => {
    grids.push(props);

    return <div role="grid" aria-rowcount={props.rowData?.length ?? 0} />;
  },
}));

const ALL_ROWS = { entityClauses: [], spendColumn: SpendColumn.Deployment };

const loaded = <T,>(data: T): RequestState<T> => ({ data, isLoading: false, hasFailed: false });

const row = (id: string, calls: number, failed = 0): BreakdownRow => ({
  id,
  label: id,
  isFallbackLabel: false,
  measures: { ...EMPTY_MEASURES, calls, failed },
});

const fallbackRow = (calls: number, column = 'mcp_tool_call_name'): BreakdownRow => ({
  id: `${column}:missing`,
  label: '',
  isFallbackLabel: true,
  measures: { ...EMPTY_MEASURES, calls },
});

const ROWS = [row('gpt-4o', 60), row('claude-sonnet', 40)];

const WINDOW = {
  startDate: new Date('2026-09-16T00:00:00.000Z'),
  endDate: new Date('2026-09-17T00:00:00.000Z'),
};

const PREVIOUS_WINDOW = {
  startDate: new Date('2026-09-15T00:00:00.000Z'),
  endDate: new Date('2026-09-16T00:00:00.000Z'),
};

const NOTICE = { report: vi.fn(), reset: vi.fn() };

type Props = Parameters<typeof BreakdownTable>[0];

const renderTable = (props: Partial<Props> = {}) =>
  render(
    <BreakdownTable
      view={UsageView.Llm}
      rowScope={ALL_ROWS}
      tabs={VIEW_BREAKDOWN_TABS[props.view ?? UsageView.Llm]}
      tab={BreakdownTab.Models}
      onTabChange={vi.fn()}
      rows={loaded<BreakdownRow[]>(ROWS)}
      previousRows={loaded<BreakdownRow[]>([])}
      windowTotal={200}
      windows={{ current: WINDOW }}
      rowLimit={10}
      isShowingAll={false}
      onShowAll={vi.fn()}
      onHideAll={vi.fn()}
      onOpenRow={vi.fn()}
      notice={NOTICE}
      {...props}
    />,
  );

const cardGrid = () => grids[0] as CapturedGrid & { rowData: BreakdownRowModel[] };

describe('BreakdownTable', () => {
  beforeEach(() => {
    grids.length = 0;
  });

  test('offers the dimensions the LLM view breaks down by', () => {
    renderTable();

    expect(screen.getByText(AnalyticsUsageI18nKey.BreakdownTabModels)).toBeTruthy();
    expect(screen.getByText(AnalyticsUsageI18nKey.BreakdownTabApplications)).toBeTruthy();
    expect(screen.getByText(AnalyticsUsageI18nKey.BreakdownTabProjects)).toBeTruthy();
  });

  test('offers only the tabs it is handed, which is how an entity block drops one', () => {
    renderTable({ tabs: [BreakdownTab.Applications, BreakdownTab.Projects], tab: BreakdownTab.Applications });

    expect(screen.queryByText(AnalyticsUsageI18nKey.BreakdownTabModels)).toBeNull();
    expect(screen.getByText(AnalyticsUsageI18nKey.BreakdownTabApplications)).toBeTruthy();
  });

  test('offers the MCP dimensions instead in that view', () => {
    renderTable({ view: UsageView.Mcp, tab: BreakdownTab.McpServers });

    expect(screen.getByText(AnalyticsUsageI18nKey.BreakdownTabMcpServers)).toBeTruthy();
    expect(screen.getByText(AnalyticsUsageI18nKey.BreakdownTabTools)).toBeTruthy();
    expect(screen.queryByText(AnalyticsUsageI18nKey.BreakdownTabModels)).toBeNull();
  });

  test('divides a share by the window total rather than by the rows it was sent', () => {
    renderTable();

    // 60 of a 200-call window, not 60 of the 100 the two rows add up to.
    expect(cardGrid().rowData[0].share).toBe(0.3);
  });

  test('states an error rate per row', () => {
    renderTable({ rows: loaded<BreakdownRow[]>([row('gpt-4o', 50, 5)]) });

    expect(cardGrid().rowData[0].errorRate).toBe(0.1);
  });

  test('states a change inside each measure cell rather than in a column of its own', () => {
    renderTable({ windows: { current: WINDOW, previous: PREVIOUS_WINDOW } });

    expect(cardGrid().columnDefs.some((column) => column.colId === 'delta')).toBe(false);
    expect(cardGrid().columnDefs.map((column) => column.colId)).toContain('cost');
  });

  test('states the change for a row both windows carried', () => {
    renderTable({
      windows: { current: WINDOW, previous: PREVIOUS_WINDOW },
      previousRows: loaded<BreakdownRow[]>([row('gpt-4o', 30)]),
    });

    expect(cardGrid().rowData[0].deltas.calls).toBe(1);
  });

  test('calls a row new only when the previous window listed the whole dimension', () => {
    renderTable({
      windows: { current: WINDOW, previous: PREVIOUS_WINDOW },
      rowLimit: 10,
      previousRows: loaded<BreakdownRow[]>([row('claude-sonnet', 10)]),
    });

    expect(cardGrid().rowData[0].isNewRow).toBe(true);
  });

  test('calls nothing new when the previous window recorded nothing to compare against', () => {
    renderTable({ windows: { current: WINDOW, previous: PREVIOUS_WINDOW }, previousRows: loaded<BreakdownRow[]>([]) });

    expect(cardGrid().rowData.every((model) => !model.isNewRow)).toBe(true);
  });

  test('calls nothing new when the previous response was cut at the page size', () => {
    renderTable({
      windows: { current: WINDOW, previous: PREVIOUS_WINDOW },
      rowLimit: 1,
      previousRows: loaded<BreakdownRow[]>([row('claude-sonnet', 10)]),
    });

    expect(cardGrid().rowData[0].isNewRow).toBe(false);
    expect(cardGrid().rowData[0].deltas.calls).toBeNull();
  });

  test('leaves the Tools tab to its own ranking, having no bucket to pin', () => {
    renderTable({
      view: UsageView.Mcp,
      tab: BreakdownTab.Tools,
      rows: loaded<BreakdownRow[]>([fallbackRow(4706), row('execute_python', 142)]),
    });

    expect(cardGrid().rowData.map((model) => model.id)).toEqual(['mcp_tool_call_name:missing', 'execute_python']);
  });

  test('leaves a fallback bucket in its ranked place on the other tabs', () => {
    renderTable({
      tab: BreakdownTab.Applications,
      rows: loaded<BreakdownRow[]>([fallbackRow(900, 'parent_deployment'), row('gpt-4o', 10)]),
    });

    expect(cardGrid().rowData[0].id).toBe('parent_deployment:missing');
  });

  test('states that the window held nothing, keeping the grid and its headers', () => {
    renderTable({ rows: loaded<BreakdownRow[]>([]) });

    expect(screen.getByText(AnalyticsUsageI18nKey.BreakdownEmptyTitle)).toBeTruthy();
    expect(screen.getAllByRole('grid').length).toBeGreaterThan(0);
  });

  test('asks for the full list from the card control', async () => {
    const user = userEvent.setup();
    const onShowAll = vi.fn();
    renderTable({ onShowAll });

    await user.click(screen.getByRole('button', { name: AnalyticsUsageI18nKey.ViewAll }));

    expect(onShowAll).toHaveBeenCalledOnce();
  });

  test('offers no column filters on either surface, and searches the dimension instead', () => {
    renderTable({ isShowingAll: true });

    const [card, dialog] = grids;

    expect(card.columnDefs.every((column) => column.filter === false)).toBe(true);
    expect(dialog.columnDefs.every((column) => column.filter === false)).toBe(true);
    expect(screen.getByRole('textbox', { name: AnalyticsUsageI18nKey.SearchPlaceholder })).toBeTruthy();
  });

  test("leaves the dimension cell's tooltips to the cell, not the grid's default one", () => {
    renderTable({ isShowingAll: true });

    for (const grid of grids) {
      const dimension = grid.columnDefs.find((column) => column.colId === 'dimension');
      expect(dimension?.tooltipValueGetter?.()).toBeNull();
    }
  });

  test('holds the term the reader typed, which the dialog reads the dimension again with', () => {
    renderTable({ isShowingAll: true });

    const field = screen.getByRole('textbox', { name: AnalyticsUsageI18nKey.SearchPlaceholder });
    fireEvent.change(field, { target: { value: 'gpt' } });

    expect(field).toHaveValue('gpt');
  });
});

describe('BreakdownTable cost column and tab description', () => {
  beforeEach(() => {
    grids.length = 0;
  });

  test('states the cost of each row in the LLM view', () => {
    renderTable();

    expect(grids[0].columnDefs.map((column) => column.colId)).toContain('cost');
  });

  test('omits the cost column in the MCP view, where a row carries no price', () => {
    renderTable({ view: UsageView.Mcp, tab: BreakdownTab.McpServers });

    expect(grids[0].columnDefs.map((column) => column.colId)).not.toContain('cost');
  });

  test('describes what the active tab counts, so a reader knows what one row aggregates', () => {
    const { rerender } = renderTable();

    expect(screen.getByText(AnalyticsUsageI18nKey.BreakdownDescriptionModels)).toBeInTheDocument();

    rerender(
      <BreakdownTable
        view={UsageView.Llm}
        rowScope={ALL_ROWS}
        tabs={VIEW_BREAKDOWN_TABS[UsageView.Llm]}
        tab={BreakdownTab.Projects}
        onTabChange={vi.fn()}
        rows={loaded<BreakdownRow[]>(ROWS)}
        previousRows={loaded<BreakdownRow[]>([])}
        windowTotal={200}
        windows={{ current: WINDOW }}
        rowLimit={10}
        isShowingAll={false}
        onShowAll={vi.fn()}
        onHideAll={vi.fn()}
        onOpenRow={vi.fn()}
        notice={NOTICE}
      />,
    );

    expect(screen.getByText(AnalyticsUsageI18nKey.BreakdownDescriptionProjects)).toBeInTheDocument();
  });

  test('hands the dialog a paged datasource rather than the card rows', () => {
    renderTable({ isShowingAll: true });

    const [card, dialog] = grids;

    expect(card.rowData).toBeTruthy();
    expect(dialog.rowData).toBeUndefined();
  });
});

describe('BreakdownTable in the Routes view', () => {
  beforeEach(() => {
    grids.length = 0;
  });

  const ownerRows = [row('app-a', 60), row('/proxy', 40)];
  const pathRow: BreakdownRow = {
    ...row('/proxy\u0000POST\u0000/proxy/v1/messages', 40),
    label: '/proxy/v1/messages',
    qualifiers: ['/proxy', 'POST'],
  };

  test('offers owners, paths, callers and projects, opening on owners', () => {
    renderTable({ view: UsageView.Routes, tab: BreakdownTab.Owners, rows: loaded(ownerRows) });

    for (const key of [
      AnalyticsUsageI18nKey.BreakdownTabOwners,
      AnalyticsUsageI18nKey.BreakdownTabPaths,
      AnalyticsUsageI18nKey.BreakdownTabCallers,
      AnalyticsUsageI18nKey.BreakdownTabProjects,
    ]) {
      expect(screen.getByText(key)).toBeTruthy();
    }
    expect(screen.queryByText(AnalyticsUsageI18nKey.BreakdownTabModels)).toBeNull();
  });

  test('states each owner row kind as text, and no cost', () => {
    renderTable({ view: UsageView.Routes, tab: BreakdownTab.Owners, rows: loaded(ownerRows) });

    expect(grids[0].columnDefs.map((column) => column.colId)).toContain('routeKind');
    expect(grids[0].columnDefs.map((column) => column.colId)).not.toContain('cost');
    expect(cardGrid().rowData.map((model) => model.routeKind)).toEqual([RouteKind.Application, RouteKind.Global]);
  });

  test("states a path row's method and owner beneath it", () => {
    renderTable({ view: UsageView.Routes, tab: BreakdownTab.Paths, rows: loaded([pathRow]) });

    expect(cardGrid().rowData[0].subLabel).toBe('POST · /proxy');
    expect(cardGrid().rowData[0].routeKind).toBe(RouteKind.Global);
  });

  test('states no kind on the callers tab, and names a direct call there', () => {
    const missing = { ...row('parent_deployment:missing', 5), label: '', isFallbackLabel: true };
    renderTable({ view: UsageView.Routes, tab: BreakdownTab.Callers, rows: loaded([missing]) });

    expect(grids[0].columnDefs.map((column) => column.colId)).not.toContain('routeKind');
    expect(cardGrid().rowData[0].displayLabel).toBe(AnalyticsUsageI18nKey.DirectCall);
    expect(cardGrid().rowData[0].fallbackTooltip).toBe(AnalyticsUsageI18nKey.DirectCallRouteTooltip);
  });
});
