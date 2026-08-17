import { render } from '@testing-library/react';
import { ColDef, ColGroupDef, GridOptions, GridReadyEvent, IDatasource } from 'ag-grid-community';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ConversationsList from '@/src/components/Analytics/ConversationsTrace/List/ConversationsList';
import { PAGE_SIZE } from '@/src/constants/ag-grid';
import {
  CONVERSATIONS_GROUP_HEADER_HEIGHT,
  CONVERSATIONS_HEADER_HEIGHT,
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
import { AnalyticsFieldType } from '@/src/models/analytics/entity';

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

const renderList = () =>
  render(
    <ConversationsList
      datasource={datasource}
      onGridReady={onGridReady}
      isColumnsPanelOpen={false}
      onToggleColumnsPanel={vi.fn()}
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
    });
    expect(captured.additionalGridOptions?.defaultColDef).toBeUndefined();
  });
});

describe('ConversationsList :: columns', () => {
  test('renders the ten columns in order', () => {
    renderList();

    expect(leafColumns().map((column) => column.field)).toEqual([
      ConversationsField.ChatId,
      ConversationsField.ProjectId,
      ConversationsField.UserHash,
      ConversationsField.TurnCount,
      ConversationsField.LastRequestTime,
      ConversationsField.TotalTokens,
      ConversationsField.TotalPrice,
      ConversationsField.DurationMs,
      ConversationsField.Deployments,
      ConversationColumn.Rating,
    ]);
  });

  test('groups every column under exactly one provenance', () => {
    renderList();

    const groups = captured.columnDefs ?? [];

    expect(groups.map((group) => group.groupId)).toEqual([ColumnProvenance.Conversations, ColumnProvenance.Feedback]);
    expect(groups.every((group) => group.marryChildren)).toBe(true);
    expect(leafColumns()).toHaveLength(10);
  });

  test('attributes the rating column to the feedback entity and the rest to conversations', () => {
    renderList();

    const [conversations, feedback] = captured.columnDefs ?? [];

    expect((conversations.children as ColDef[]).map((column) => column.field)).not.toContain(ConversationColumn.Rating);
    expect((feedback.children as ColDef[]).map((column) => column.field)).toEqual([ConversationColumn.Rating]);
  });

  test('labels the groups and their tooltips from i18n', () => {
    renderList();

    expect(captured.columnDefs?.[0]).toMatchObject({
      headerName: ConversationsTraceI18nKey.ProvenanceConversations,
      headerTooltip: ConversationsTraceI18nKey.ProvenanceConversationsHint,
    });
  });

  test('offers a schema-driven column, hidden, inside the conversations group', () => {
    render(
      <ConversationsList
        datasource={datasource}
        onGridReady={onGridReady}
        isColumnsPanelOpen={false}
        onToggleColumnsPanel={vi.fn()}
        schemaFields={[{ name: 'success_count', type: AnalyticsFieldType.Integer, source: 'conversations' }]}
      />,
    );

    const [conversations] = captured.columnDefs ?? [];
    const added = (conversations.children as ColDef[]).find((column) => column.field === 'success_count');

    expect(added).toMatchObject({ hide: true });
  });

  test('offers nothing extra when the schema is unavailable', () => {
    renderList();

    expect(leafColumns()).toHaveLength(10);
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
