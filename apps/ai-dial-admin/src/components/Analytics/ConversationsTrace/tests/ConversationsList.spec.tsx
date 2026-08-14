import { render } from '@testing-library/react';
import { ColDef, ColGroupDef, GridOptions, GridReadyEvent, IDatasource } from 'ag-grid-community';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ConversationsList from '@/src/components/Analytics/ConversationsTrace/List/ConversationsList';
import { PAGE_SIZE } from '@/src/constants/ag-grid';
import {
  CONVERSATIONS_GROUP_HEADER_HEIGHT,
  CONVERSATIONS_HEADER_HEIGHT,
  CONVERSATIONS_ROW_HEIGHT,
} from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import {
  ColumnProvenance,
  ConversationColumn,
  ConversationRow,
  ConversationsField,
} from '@/src/models/analytics/conversations-trace';

interface CapturedProps {
  rowData?: ConversationRow[] | null;
  columnDefs?: ColGroupDef[];
  additionalGridOptions?: GridOptions;
  emptyDataProps?: { title?: string };
  storageKey?: string;
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

const renderList = () => render(<ConversationsList datasource={datasource} onGridReady={onGridReady} />);

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

  // Column groups plus persisted state is the one combination that is genuinely unsafe.
  test('persists no column state', () => {
    renderList();

    expect(captured.storageKey).toBeUndefined();
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
  test('renders the eight columns in order', () => {
    renderList();

    expect(leafColumns().map((column) => column.field)).toEqual([
      ConversationsField.ChatId,
      ConversationsField.ProjectId,
      ConversationsField.UserHash,
      ConversationsField.TurnCount,
      ConversationsField.LastRequestTime,
      ConversationsField.TotalTokens,
      ConversationsField.TotalPrice,
      ConversationColumn.Rating,
    ]);
  });

  test('groups every column under exactly one provenance', () => {
    renderList();

    const groups = captured.columnDefs ?? [];

    expect(groups.map((group) => group.groupId)).toEqual([ColumnProvenance.Conversations, ColumnProvenance.Feedback]);
    expect(groups.every((group) => group.marryChildren)).toBe(true);
    expect(leafColumns()).toHaveLength(8);
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

  // The page's filters are query predicates over the whole result; a column filter would narrow only the
  // blocks already fetched and report that as the complete answer.
  test('is read-only — no column sorts and none offers a filter', () => {
    renderList();

    leafColumns().forEach((column) => {
      expect(column.sortable).toBe(false);
      expect(column.filter).toBe(false);
      expect(column.floatingFilter).toBe(false);
    });
  });
});
