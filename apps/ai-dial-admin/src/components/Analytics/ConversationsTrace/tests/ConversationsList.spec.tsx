import { render } from '@testing-library/react';
import { ColDef, ColGroupDef, GridOptions, GridReadyEvent, IDatasource } from 'ag-grid-community';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ConversationsList from '@/src/components/Analytics/ConversationsTrace/List/ConversationsList';
import { PAGE_SIZE } from '@/src/constants/ag-grid';
import {
  CONVERSATIONS_FLOATING_FILTER_HEIGHT,
  CONVERSATIONS_GROUP_HEADER_HEIGHT,
  CONVERSATIONS_HEADER_HEIGHT,
  CONVERSATIONS_HEADER_STACK_HEIGHT,
  CONVERSATIONS_ROW_HEIGHT,
  CONVERSATIONS_STORAGE_KEY,
} from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import {
  ColumnProvenance,
  ConversationColumn,
  ConversationRow,
  ConversationsField,
} from '@/src/models/analytics/conversations-trace';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';

interface CapturedProps {
  rowData?: ConversationRow[] | null;
  columnDefs?: ColGroupDef[];
  additionalGridOptions?: GridOptions;
  emptyDataProps?: { title?: string };
  storageKey?: string;
  isLiveData?: boolean;
  showColumnsPanel?: boolean;
  onGridReady?: (event: GridReadyEvent) => void;
  getRowId?: (params: { data: ConversationRow }) => string;
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
  [ConversationsField.ChatId]: 'identity',
  [ConversationsField.FirstRequestTime]: 'identity',
  [ConversationsField.LastRequestTime]: 'identity',
  [ConversationsField.Traces]: 'identity',
  [ConversationsField.ProjectId]: 'principal',
  [ConversationsField.UserHash]: 'principal',
  [ConversationsField.TurnCount]: 'response',
  [ConversationsField.SuccessCount]: 'response',
  [ConversationsField.PromptTokens]: 'token-usage',
  [ConversationsField.CompletionTokens]: 'token-usage',
  [ConversationsField.TotalTokens]: 'token-usage',
  [ConversationsField.TotalPrice]: 'cost',
  [ConversationsField.DurationMs]: 'performance',
  [ConversationsField.AvgDurationMs]: 'performance',
  [ConversationsField.Deployments]: 'deployment',
};

const ALL_FIELDS: AnalyticsEntityField[] = Object.values(ConversationsField).map((name) => ({
  name,
  type:
    name === ConversationsField.Deployments || name === ConversationsField.Traces
      ? AnalyticsFieldType.Array
      : AnalyticsFieldType.String,
  source: name.includes('.') ? name.slice(name.indexOf('.') + 1) : name,
  tag: TAG_BY_FIELD[name] ?? 'insight',
}));

// The field behind the defect: the frontend enum has no member for it, because nothing designs a column for
// it — the schema is what offers it.
const INSIGHT_MODEL_FIELD: AnalyticsEntityField = {
  name: 'conversation_insights.model',
  source: 'model',
  type: AnalyticsFieldType.String,
  tag: 'provenance',
  display_name: 'Model',
};

const renderList = (schemaFields: AnalyticsEntityField[] | null = ALL_FIELDS) =>
  render(
    <ConversationsList
      datasource={datasource}
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

describe('ConversationsList :: paging', () => {
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

  test('identifies rows by conversation id', () => {
    renderList();

    expect(captured.getRowId?.({ data: { chat_id: 'abc' } as ConversationRow })).toBe('abc');
  });

  test('persists column state under a per-view key', () => {
    renderList();

    expect(captured.storageKey).toBe(CONVERSATIONS_STORAGE_KEY);
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
      rowHeight: CONVERSATIONS_ROW_HEIGHT,
      headerHeight: CONVERSATIONS_HEADER_HEIGHT,
      groupHeaderHeight: CONVERSATIONS_GROUP_HEADER_HEIGHT,
      floatingFiltersHeight: CONVERSATIONS_FLOATING_FILTER_HEIGHT,
    });
    expect(captured.additionalGridOptions?.defaultColDef).toBeUndefined();
  });

  // The view offsets its empty state by this sum to keep the filter inputs reachable, so a height configured
  // here and not counted there would put the overlay back over the controls.
  test('the header stack the view offsets by is the sum of the heights configured here', () => {
    renderList();

    const { headerHeight, groupHeaderHeight, floatingFiltersHeight } = captured.additionalGridOptions ?? {};

    expect((headerHeight ?? 0) + (groupHeaderHeight ?? 0) + (floatingFiltersHeight ?? 0)).toBe(
      CONVERSATIONS_HEADER_STACK_HEIGHT,
    );
  });
});

// The default visible set is unchanged, but grouping reorders it: last activity carries the `identity` tag.
const DEFAULT_VISIBLE = [
  ConversationsField.ChatId,
  ConversationsField.LastRequestTime,
  ConversationsField.ProjectId,
  ConversationsField.UserHash,
  ConversationsField.TotalPrice,
  ConversationColumn.Rating,
];

const CURATED_COLUMNS = [
  ConversationsField.ChatId,
  ConversationsField.ProjectId,
  ConversationsField.UserHash,
  ConversationsField.TurnCount,
  ConversationsField.LastRequestTime,
  ConversationsField.TotalTokens,
  ConversationsField.TotalPrice,
  ConversationsField.Deployments,
  ConversationsField.InsightTopics,
  ConversationColumn.Rating,
];

describe('ConversationsList :: columns', () => {
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
    expect(fields).toContain(ConversationsField.SuccessCount);
    expect(fields).toContain(ConversationsField.DurationMs);
    expect(fields.length).toBeGreaterThan(CURATED_COLUMNS.length);
  });

  test('locks the identity column against being hidden', () => {
    renderList();

    expect(leafColumns()[0]).toMatchObject({ field: ConversationsField.ChatId, lockVisible: true });
  });

  test('reads a dotted enrichment name as a flat key', () => {
    renderList();

    expect(captured.additionalGridOptions?.suppressFieldDotNotation).toBe(true);
  });

  test('groups every column under exactly one origin-and-tag pair', () => {
    renderList();

    const groups = captured.columnDefs ?? [];
    const attributed = leafColumns().map((column) => column.field);

    expect(groups.map((group) => group.groupId)).toContain(`${ColumnProvenance.Conversations}:identity`);
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

    expect(groupFields(`${ColumnProvenance.Conversations}:identity`)).toEqual([
      ConversationsField.ChatId,
      ConversationsField.LastRequestTime,
    ]);
    expect(groupFields(`${ColumnProvenance.Insights}:insight`)).toContain(ConversationsField.InsightTopics);
    expect(groupFields(`${ColumnProvenance.Feedback}`)).toEqual([ConversationColumn.Rating]);
  });

  test('labels a rollup group by its tag and an enrichment group by its enrichment too', () => {
    renderList();

    const header = (groupId: string) =>
      (captured.columnDefs ?? []).find((group) => group.groupId === groupId)?.headerName;

    expect(header(`${ColumnProvenance.Conversations}:identity`)).toBe(ConversationsTraceI18nKey.TagIdentity);
    expect(header(`${ColumnProvenance.Insights}:insight`)).toBe(
      `${ConversationsTraceI18nKey.ProvenanceInsights} · ${ConversationsTraceI18nKey.TagInsight}`,
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
      `${ConversationsTraceI18nKey.ProvenanceInsights} · ${ConversationsTraceI18nKey.TagProvenance}`,
    );
    expect((bookkeeping?.children as ColDef[]).map((column) => column.field)).toContain(INSIGHT_MODEL_FIELD.name);
  });

  test('omits the insight columns on an instance without the enrichment', () => {
    renderList(ALL_FIELDS.filter((entityField) => !entityField.name.startsWith('conversation_insights.')));

    const fields = leafColumns().map((column) => column.field);

    expect(fields).not.toContain(ConversationsField.InsightTitle);
    expect(fields).not.toContain(ConversationsField.InsightTopics);
    expect(fields).toContain(ConversationsField.ChatId);
    expect(fields).toContain(ConversationColumn.Rating);
  });

  test('keeps rating out of the offered set', () => {
    renderList();

    const rating = leafColumns().find((column) => column.field === ConversationColumn.Rating);

    expect(rating?.suppressColumnsToolPanel ?? false).toBe(false);
    expect(rating?.hide ?? false).toBe(false);
  });

  test('offers sort and filter on field-backed columns only', () => {
    renderList();

    const rating = leafColumns().find((column) => column.field === ConversationColumn.Rating);
    expect(rating?.sortable).toBe(false);
    expect(rating?.filter).toBe(false);

    const activity = leafColumns().find((column) => column.field === ConversationsField.LastRequestTime);
    expect(activity?.sortable).not.toBe(false);
    expect(activity?.filter).toBe(false);

    const project = leafColumns().find((column) => column.field === ConversationsField.ProjectId);
    expect(project?.sortable).not.toBe(false);
    expect(project?.filter).not.toBe(false);
  });
});
