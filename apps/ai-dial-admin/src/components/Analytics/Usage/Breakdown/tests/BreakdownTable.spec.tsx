import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import BreakdownTable from '@/src/components/Analytics/Usage/Breakdown/BreakdownTable';
import {
  BreakdownRow,
  BreakdownRowModel,
  BreakdownTab,
  RequestState,
  UsageView,
} from '@/src/components/Analytics/Usage/models';
import { EMPTY_MEASURES } from '@/src/components/Analytics/Usage/utils/folds';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';

interface CapturedGrid {
  rowData: BreakdownRowModel[];
  columnDefs: { colId?: string; filter?: boolean }[];
}

const grids: CapturedGrid[] = [];

// AG Grid is the heavy child; this spec is about the rows and columns handed to it.
vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: (props: CapturedGrid) => {
    grids.push(props);

    return <div role="grid" aria-rowcount={props.rowData.length} />;
  },
}));

const loaded = <T,>(data: T): RequestState<T> => ({ data, isLoading: false, hasFailed: false });

const row = (id: string, calls: number, failed = 0): BreakdownRow => ({
  id,
  label: id,
  isFallbackLabel: false,
  measures: { ...EMPTY_MEASURES, calls, failed },
});

const ROWS = [row('gpt-4o', 60), row('claude-sonnet', 40)];

const WINDOW = {
  startDate: new Date('2026-09-16T00:00:00.000Z'),
  endDate: new Date('2026-09-17T00:00:00.000Z'),
};

type Props = Parameters<typeof BreakdownTable>[0];

const renderTable = (props: Partial<Props> = {}) =>
  render(
    <BreakdownTable
      view={UsageView.Llm}
      tab={BreakdownTab.Models}
      onTabChange={vi.fn()}
      rows={loaded<BreakdownRow[]>(ROWS)}
      previousRows={loaded<BreakdownRow[]>([])}
      windowTotal={200}
      hasComparison={false}
      window={WINDOW}
      rowLimit={10}
      searchTerm=""
      onSearchChange={vi.fn()}
      isShowingAll={false}
      onShowAll={vi.fn()}
      onHideAll={vi.fn()}
      onOpenRow={vi.fn()}
      {...props}
    />,
  );

const cardGrid = () => grids[0];

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

  test('adds no delta column while comparison is off', () => {
    renderTable();

    expect(cardGrid().columnDefs.some((column) => column.colId === 'delta')).toBe(false);
  });

  test('adds the delta column once comparison is on', () => {
    renderTable({ hasComparison: true, previousRows: loaded<BreakdownRow[]>([row('gpt-4o', 30)]) });

    expect(cardGrid().columnDefs.some((column) => column.colId === 'delta')).toBe(true);
  });

  test('states the change for a row both windows carried', () => {
    renderTable({ hasComparison: true, previousRows: loaded<BreakdownRow[]>([row('gpt-4o', 30)]) });

    expect(cardGrid().rowData[0].deltaRatio).toBe(1);
  });

  test('calls a row new only when the previous window listed the whole dimension', () => {
    renderTable({
      hasComparison: true,
      rowLimit: 10,
      previousRows: loaded<BreakdownRow[]>([row('claude-sonnet', 10)]),
    });

    expect(cardGrid().rowData[0].isNewRow).toBe(true);
  });

  test('calls nothing new when the previous window recorded nothing to compare against', () => {
    renderTable({ hasComparison: true, previousRows: loaded<BreakdownRow[]>([]) });

    expect(cardGrid().rowData.every((model) => !model.isNewRow)).toBe(true);
  });

  test('calls nothing new when the previous response was cut at the page size', () => {
    renderTable({
      hasComparison: true,
      rowLimit: 1,
      previousRows: loaded<BreakdownRow[]>([row('claude-sonnet', 10)]),
    });

    expect(cardGrid().rowData[0].isNewRow).toBe(false);
    expect(cardGrid().rowData[0].deltaRatio).toBeNull();
  });

  test('reports a typed term so the request can reach rows the page never held', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    renderTable({ onSearchChange });

    await user.type(screen.getByRole('textbox', { name: AnalyticsUsageI18nKey.SearchPlaceholder }), 'g');

    expect(onSearchChange).toHaveBeenCalledWith('g');
  });

  test('names the term when nothing matched it', () => {
    renderTable({ rows: loaded<BreakdownRow[]>([]), searchTerm: 'zzz' });

    expect(screen.getByText(AnalyticsUsageI18nKey.SearchNoMatches)).toBeTruthy();
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

  test('sifts the full list with its own column filters, which the card does not offer', () => {
    renderTable({ isShowingAll: true });

    const [card, dialog] = grids;

    expect(card.columnDefs.every((column) => column.filter === false)).toBe(true);
    expect(dialog.columnDefs.some((column) => column.filter === true)).toBe(true);
  });
});
