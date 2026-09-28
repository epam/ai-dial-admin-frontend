import { render } from '@testing-library/react';
import { ColDef, ColGroupDef, GridOptions, GridReadyEvent, IDatasource } from 'ag-grid-community';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import SessionsList from '@/src/components/Analytics/SessionsTrace/List/SessionsList';
import { PAGE_SIZE } from '@/src/constants/ag-grid';
import {
  SESSIONS_FLOATING_FILTER_HEIGHT,
  SESSIONS_GROUP_HEADER_HEIGHT,
  SESSIONS_HEADER_HEIGHT,
  SESSIONS_HEADER_STACK_HEIGHT,
  SESSIONS_ROW_HEIGHT,
  SESSIONS_STORAGE_KEY,
} from '@/src/constants/analytics/sessions-trace';
import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import { ColumnProvenance, SessionColumn, SessionRow, SessionsField } from '@/src/models/analytics/sessions-trace';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';

interface CapturedProps {
  rowData?: SessionRow[] | null;
  columnDefs?: ColGroupDef[];
  additionalGridOptions?: GridOptions;
  emptyDataProps?: { title?: string };
  storageKey?: string;
  isLiveData?: boolean;
  showColumnsPanel?: boolean;
  onGridReady?: (event: GridReadyEvent) => void;
  getRowId?: (params: { data: SessionRow }) => string;
}

const leafColumns = (): ColDef[] => (captured.columnDefs ?? []).flatMap((group) => group.children as ColDef[]);

let captured: CapturedProps = {};

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: (props: CapturedProps) => {
    captured = props;
    return <section aria-label="grid" />;
  },
}));

const datasource: IDatasource = { getRows: vi.fn() };
const onGridReady = vi.fn();

// Every field this view can read, tagged as the live entity tags them.
const TAG_BY_FIELD: Record<string, string> = {
  [SessionsField.ChatId]: 'identity',
  [SessionsField.FirstRequestTime]: 'identity',
  [SessionsField.LastRequestTime]: 'identity',
  [SessionsField.Traces]: 'identity',
  [SessionsField.ProjectId]: 'principal',
  [SessionsField.UserHash]: 'principal',
  [SessionsField.TurnCount]: 'response',
  [SessionsField.SuccessCount]: 'response',
  [SessionsField.PromptTokens]: 'token-usage',
  [SessionsField.CompletionTokens]: 'token-usage',
  [SessionsField.TotalTokens]: 'token-usage',
  [SessionsField.TotalPrice]: 'cost',
  [SessionsField.DurationMs]: 'performance',
  [SessionsField.AvgDurationMs]: 'performance',
  [SessionsField.Deployments]: 'deployment',
};

const ALL_FIELDS: AnalyticsEntityField[] = Object.values(SessionsField).map((name) => ({
  name,
  type:
    name === SessionsField.Deployments || name === SessionsField.Traces
      ? AnalyticsFieldType.Array
      : AnalyticsFieldType.String,
  source: name.includes('.') ? name.slice(name.indexOf('.') + 1) : name,
  tag: TAG_BY_FIELD[name] ?? 'insight',
}));

// The field behind the defect: the frontend enum has no member for it, because nothing designs a column for
// it — the schema is what offers it.
const INSIGHT_MODEL_FIELD: AnalyticsEntityField = {
  name: 'session_insights.model',
  source: 'model',
  type: AnalyticsFieldType.String,
  tag: 'provenance',
  display_name: 'Model',
};

const renderList = (schemaFields: AnalyticsEntityField[] | null = ALL_FIELDS) =>
  render(
    <SessionsList
      datasource={datasource}
      gridContext={{ requestFieldValues: vi.fn() }}
      onGridReady={onGridReady}
      isColumnsPanelOpen={false}
      onToggleColumnsPanel={vi.fn()}
      schemaFields={schemaFields}
    />,
  );

beforeEach(() => {
  captured = {};
  vi.clearAllMocks();
});

describe('SessionsList :: paging', () => {
  // Rows arrive block by block from the backend, so the grid is never handed an array to narrow.
  test('drives the grid from a datasource rather than from row data', () => {
    renderList();

    expect(captured.additionalGridOptions?.datasource).toBe(datasource);
    expect(captured.rowData).toBeUndefined();
  });

  test('uses the shared infinite row model and page size', () => {
    renderList();

    expect(captured.additionalGridOptions?.rowModelType).toBe('infinite');
    expect(captured.additionalGridOptions?.cacheBlockSize).toBe(PAGE_SIZE);
  });

  test('passes the grid-ready handler through so the datasource can be reattached', () => {
    renderList();

    expect(captured.onGridReady).toBe(onGridReady);
  });

  test('identifies rows by session id', () => {
    renderList();

    expect(captured.getRowId?.({ data: { client_session_id: 'abc' } as SessionRow })).toBe('abc');
  });

  test('persists column state under a per-view key', () => {
    renderList();

    expect(captured.storageKey).toBe(SESSIONS_STORAGE_KEY);
  });

  test('restores persisted state through the live-data branch', () => {
    renderList();

    expect(captured.isLiveData).toBe(true);
  });

  // The view renders the app's no-data content; AG Grid's untranslated overlay would cover it.
  test('leaves the empty state to the view rather than the grid', () => {
    renderList();

    expect(captured.additionalGridOptions?.suppressNoRowsOverlay).toBe(true);
  });

  test('owns its row and header heights without replacing the shared column defaults', () => {
    renderList();

    expect(captured.additionalGridOptions).toMatchObject({
      rowHeight: SESSIONS_ROW_HEIGHT,
      headerHeight: SESSIONS_HEADER_HEIGHT,
      groupHeaderHeight: SESSIONS_GROUP_HEADER_HEIGHT,
      floatingFiltersHeight: SESSIONS_FLOATING_FILTER_HEIGHT,
    });
    expect(captured.additionalGridOptions?.defaultColDef).toBeUndefined();
  });

  // The view offsets its empty state by this sum to keep the filter inputs reachable, so a height configured
  // here and not counted there would put the overlay back over the controls.
  test('the header stack the view offsets by is the sum of the heights configured here', () => {
    renderList();

    const { headerHeight, groupHeaderHeight, floatingFiltersHeight } = captured.additionalGridOptions ?? {};

    expect((headerHeight ?? 0) + (groupHeaderHeight ?? 0) + (floatingFiltersHeight ?? 0)).toBe(
      SESSIONS_HEADER_STACK_HEIGHT,
    );
  });
});

// The default visible set is unchanged, but grouping reorders it: last activity carries the `identity` tag.
const DEFAULT_VISIBLE = [
  SessionsField.ChatId,
  SessionsField.LastRequestTime,
  SessionsField.ProjectId,
  SessionsField.UserHash,
  SessionsField.TotalPrice,
  SessionColumn.Rating,
];

const CURATED_COLUMNS = [
  SessionsField.ChatId,
  SessionsField.ProjectId,
  SessionsField.UserHash,
  SessionsField.TurnCount,
  SessionsField.LastRequestTime,
  SessionsField.TotalTokens,
  SessionsField.TotalPrice,
  SessionsField.Deployments,
  SessionsField.InsightTopics,
  SessionColumn.Rating,
];

describe('SessionsList :: columns', () => {
  test('renders the default-visible columns in group order', () => {
    renderList();

    const visible = leafColumns()
      .filter((column) => !column.hide)
      .map((column) => column.field);

    expect(visible).toEqual(DEFAULT_VISIBLE);
  });

  test('renders a column for every field the schema reports, the hidden ones included', () => {
    renderList();

    const fields = leafColumns().map((column) => column.field);

    CURATED_COLUMNS.forEach((fieldName) => expect(fields).toContain(fieldName));
    expect(fields).toContain(SessionsField.SuccessCount);
    expect(fields).toContain(SessionsField.DurationMs);
    expect(fields.length).toBeGreaterThan(CURATED_COLUMNS.length);
  });

  test('locks the identity column against being hidden', () => {
    renderList();

    expect(leafColumns()[0]).toMatchObject({ field: SessionsField.ChatId, lockVisible: true });
  });

  test('reads a dotted enrichment name as a flat key', () => {
    renderList();

    expect(captured.additionalGridOptions?.suppressFieldDotNotation).toBe(true);
  });

  test('groups every column under exactly one origin-and-tag pair', () => {
    renderList();

    const groups = captured.columnDefs ?? [];
    const attributed = leafColumns().map((column) => column.field);

    expect(groups.map((group) => group.groupId)).toContain(`${ColumnProvenance.Sessions}:identity`);
    expect(groups.map((group) => group.groupId)).toContain(`${ColumnProvenance.Insights}:insight`);
    expect(groups.every((group) => group.marryChildren)).toBe(true);
    expect(new Set(attributed).size).toBe(attributed.length);
  });

  test('attributes each column to the source its values actually come from', () => {
    renderList();

    const groupFields = (groupId: string) =>
      ((captured.columnDefs ?? []).find((group) => group.groupId === groupId)?.children as ColDef[]).map(
        (column) => column.field,
      );

    expect(groupFields(`${ColumnProvenance.Sessions}:identity`)).toEqual([
      SessionsField.ChatId,
      SessionsField.LastRequestTime,
    ]);
    expect(groupFields(`${ColumnProvenance.Insights}:insight`)).toContain(SessionsField.InsightTopics);
    expect(groupFields(`${ColumnProvenance.Feedback}`)).toEqual([SessionColumn.Rating]);
  });

  test('labels a rollup group by its tag and an enrichment group by its enrichment too', () => {
    renderList();

    const header = (groupId: string) =>
      (captured.columnDefs ?? []).find((group) => group.groupId === groupId)?.headerName;

    expect(header(`${ColumnProvenance.Sessions}:identity`)).toBe(SessionsTraceI18nKey.TagIdentity);
    expect(header(`${ColumnProvenance.Insights}:insight`)).toBe(
      `${SessionsTraceI18nKey.ProvenanceInsights} · ${SessionsTraceI18nKey.TagInsight}`,
    );
  });

  // The defect that withdrew the derived catalog: this field reports the display name "Model" while holding
  // the evaluator's own deployment. It is offered again, but only under a group that says so.
  test('offers the evaluator deployment only under the evaluator-run group', () => {
    renderList([...ALL_FIELDS, INSIGHT_MODEL_FIELD]);

    const bookkeeping = (captured.columnDefs ?? []).find(
      (group) => group.groupId === `${ColumnProvenance.Insights}:provenance`,
    );

    expect(bookkeeping?.headerName).toBe(
      `${SessionsTraceI18nKey.ProvenanceInsights} · ${SessionsTraceI18nKey.TagProvenance}`,
    );
    expect((bookkeeping?.children as ColDef[]).map((column) => column.field)).toContain(INSIGHT_MODEL_FIELD.name);
  });

  test('omits the insight columns on an instance without the enrichment', () => {
    renderList(ALL_FIELDS.filter((entityField) => !entityField.name.startsWith('session_insights.')));

    const fields = leafColumns().map((column) => column.field);

    expect(fields).not.toContain(SessionsField.InsightTitle);
    expect(fields).not.toContain(SessionsField.InsightTopics);
    expect(fields).toContain(SessionsField.ChatId);
    expect(fields).toContain(SessionColumn.Rating);
  });

  test('keeps rating out of the offered set', () => {
    renderList();

    const rating = leafColumns().find((column) => column.field === SessionColumn.Rating);

    expect(rating?.suppressColumnsToolPanel ?? false).toBe(false);
    expect(rating?.hide ?? false).toBe(false);
  });

  test('offers sort and filter on field-backed columns only', () => {
    renderList();

    const rating = leafColumns().find((column) => column.field === SessionColumn.Rating);
    expect(rating?.sortable).toBe(false);
    expect(rating?.filter).toBe(false);

    const activity = leafColumns().find((column) => column.field === SessionsField.LastRequestTime);
    expect(activity?.sortable).not.toBe(false);
    expect(activity?.filter).toBe(false);

    const project = leafColumns().find((column) => column.field === SessionsField.ProjectId);
    expect(project?.sortable).not.toBe(false);
    expect(project?.filter).not.toBe(false);
  });
});
