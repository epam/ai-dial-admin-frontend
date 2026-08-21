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

// Fields no curated column reads: the catalog offers each as a schema-derived hidden column, which the
// catalog's own tests count. Leaving them out keeps this fixture to exactly the curated set.
const CATALOG_ONLY_FIELDS: string[] = [
  ConversationsField.PromptTokens,
  ConversationsField.CompletionTokens,
  ConversationsField.SuccessCount,
  ConversationsField.AvgDurationMs,
  ConversationsField.Traces,
];

const ALL_FIELDS: AnalyticsEntityField[] = Object.values(ConversationsField)
  .filter((name) => !CATALOG_ONLY_FIELDS.includes(name))
  .map((name) => ({ name, type: AnalyticsFieldType.String, source: 'conversations' }));

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

// The Rating column lives in its own provenance group, so it is the last leaf rather than part of this
// run; "attributes the rating column to the feedback entity" covers where it sits.
const CONVERSATIONS_VISIBLE = [
  ConversationsField.ChatId,
  ConversationsField.ProjectId,
  ConversationsField.UserHash,
  ConversationsField.LastRequestTime,
  ConversationsField.TotalPrice,
];

// The whole set is fixed: nothing is derived from the schema, so this is a count of designed columns rather
// than of whatever the entity happens to report.
const CURATED_COLUMN_COUNT = 10;

describe('ConversationsList :: columns', () => {
  test('renders the default-visible columns in order, Rating last', () => {
    renderList();

    const visible = leafColumns()
      .filter((column) => !column.hide)
      .map((column) => column.field);

    expect(visible).toEqual([...CONVERSATIONS_VISIBLE, ConversationColumn.Rating]);
    expect(leafColumns().at(-1)?.field).toBe(ConversationColumn.Rating);
  });

  test('renders every curated column, the hidden ones included', () => {
    renderList();

    expect(leafColumns()).toHaveLength(CURATED_COLUMN_COUNT);
  });

  // The identity column is how a row is recognised and opened, and its permanence is what lets the query
  // project its enrichment field unconditionally.
  test('locks the identity column against being hidden', () => {
    renderList();

    expect(leafColumns()[0]).toMatchObject({ field: ConversationsField.ChatId, lockVisible: true });
  });

  test('reads a dotted enrichment name as a flat key', () => {
    renderList();

    expect(captured.additionalGridOptions?.suppressFieldDotNotation).toBe(true);
  });

  test('groups every column under exactly one provenance', () => {
    renderList();

    const groups = captured.columnDefs ?? [];

    expect(groups.map((group) => group.groupId)).toEqual([
      ColumnProvenance.Conversations,
      ColumnProvenance.Insights,
      ColumnProvenance.Feedback,
    ]);
    expect(groups.every((group) => group.marryChildren)).toBe(true);
    expect(leafColumns()).toHaveLength(CURATED_COLUMN_COUNT);
  });

  test('attributes each column to the source its values actually come from', () => {
    renderList();

    const [conversations, insights, feedback] = captured.columnDefs ?? [];
    const fieldsOf = (group: ColGroupDef) => (group.children as ColDef[]).map((column) => column.field);

    expect(fieldsOf(conversations)).not.toContain(ConversationColumn.Rating);
    expect(fieldsOf(conversations)).not.toContain(ConversationsField.InsightTopics);
    expect(fieldsOf(insights)).toEqual([ConversationsField.InsightTopics]);
    expect(fieldsOf(feedback)).toEqual([ConversationColumn.Rating]);
  });

  test('labels the groups and their tooltips from i18n', () => {
    renderList();

    expect(captured.columnDefs?.[0]).toMatchObject({
      headerName: ConversationsTraceI18nKey.ProvenanceConversations,
      headerTooltip: ConversationsTraceI18nKey.ProvenanceConversationsHint,
    });
  });

  // A field the entity reports but nobody designed a column for gets no column: a header taken from a
  // display name asserts a meaning no one checked, which is how a column headed "Model" came to hold the
  // evaluator's own deployment.
  test('generates no column for a reported field the curated set does not read', () => {
    render(
      <ConversationsList
        datasource={datasource}
        onGridReady={onGridReady}
        isColumnsPanelOpen={false}
        onToggleColumnsPanel={vi.fn()}
        schemaFields={[
          ...ALL_FIELDS,
          { name: 'success_count', type: AnalyticsFieldType.Integer, source: 'conversations' },
          { name: 'conversation_insights.model', type: AnalyticsFieldType.String, source: 'model' },
        ]}
      />,
    );

    const fields = leafColumns().map((column) => column.field);

    expect(fields).not.toContain('success_count');
    expect(fields).not.toContain('conversation_insights.model');
    expect(leafColumns()).toHaveLength(CURATED_COLUMN_COUNT);
  });

  // A column reading a field the instance does not carry could never fill, and the query cannot name that
  // field at all — so it is omitted rather than offered as a permanently empty column.
  test('omits the insight columns on an instance without the enrichment', () => {
    renderList(ALL_FIELDS.filter((entityField) => !entityField.name.startsWith('conversation_insights.')));

    const fields = leafColumns().map((column) => column.field);

    expect(fields).not.toContain(ConversationsField.InsightTitle);
    expect(fields).not.toContain(ConversationsField.InsightSentiment);
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
