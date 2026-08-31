import { render } from '@testing-library/react';
import { CellClickedEvent, CellKeyDownEvent, ColDef, ColGroupDef, GridOptions } from 'ag-grid-community';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useRouter } from 'next/navigation';

import ConversationsList from '@/src/components/Analytics/ConversationsTrace/List/ConversationsList';
import { conversationDetailHref } from '@/src/components/Analytics/ConversationsTrace/utils';
import { ConversationColumn, ConversationRow, ConversationsField } from '@/src/models/analytics/conversations-trace';

type Column = ColDef<ConversationRow> | ColGroupDef<ConversationRow>;

let options: GridOptions<ConversationRow> = {};
let columnDefs: Column[] = [];

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: (props: { additionalGridOptions?: GridOptions<ConversationRow>; columnDefs?: Column[] }) => {
    options = props.additionalGridOptions ?? {};
    columnDefs = props.columnDefs ?? [];
    return <section aria-label="grid" />;
  },
}));

const leafColumns = (columns: Column[]): ColDef<ConversationRow>[] =>
  columns.flatMap((column) =>
    'children' in column ? leafColumns(column.children as Column[]) : [column as ColDef<ConversationRow>],
  );

const CHAT_ID = 'conversations/eRxsos/chathub-claude4__E2E';

const ROW = { client_session_id: CHAT_ID } as ConversationRow;

const push = vi.fn();
const open = vi.fn();

// `data` is passed positionally rather than defaulted: an explicit `undefined` argument would fall back to
// a default value, so the no-data case would silently test the populated one.
const clickEvent = (event: Partial<MouseEvent>, data?: ConversationRow) =>
  ({ data, event }) as unknown as CellClickedEvent<ConversationRow>;

const keyEvent = (key: string, data?: ConversationRow) =>
  ({ data, event: { key } }) as unknown as CellKeyDownEvent<ConversationRow>;

beforeEach(() => {
  vi.clearAllMocks();
  options = {};
  (useRouter as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ push });
  vi.stubGlobal('open', open);
  render(<ConversationsList datasource={{ getRows: vi.fn() }} onGridReady={vi.fn()} />);
});

describe('conversations list row navigation', () => {
  test('opening a row navigates to the encoded detail address', () => {
    options.onCellClicked?.(clickEvent({ ctrlKey: false, metaKey: false, button: 0 }, ROW));

    expect(push).toHaveBeenCalledWith(conversationDetailHref(CHAT_ID));
  });

  test('the encoded address keeps the id as a single path segment', () => {
    expect(conversationDetailHref(CHAT_ID)).toBe(`/conversations-trace/${encodeURIComponent(CHAT_ID)}`);
    expect(conversationDetailHref(CHAT_ID)).not.toContain(`/${CHAT_ID}`);
  });

  test('the new-tab modifier opens a tab instead of navigating', () => {
    options.onCellClicked?.(clickEvent({ metaKey: true }, ROW));

    expect(open).toHaveBeenCalledWith(conversationDetailHref(CHAT_ID), '_blank');
    expect(push).not.toHaveBeenCalled();
  });

  test('Enter on a focused cell reaches the same destination as a click', () => {
    options.onCellKeyDown?.(keyEvent('Enter', ROW));

    expect(push).toHaveBeenCalledWith(conversationDetailHref(CHAT_ID));
  });

  test('another key does not navigate', () => {
    options.onCellKeyDown?.(keyEvent('a', ROW));

    expect(push).not.toHaveBeenCalled();
  });

  test('a row without data does not navigate', () => {
    options.onCellClicked?.(clickEvent({}));
    options.onCellKeyDown?.(keyEvent('Enter'));

    expect(push).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
  });

  test('rows carry the openable affordance', () => {
    const rules = options.rowClassRules as Record<string, (params: { data?: ConversationRow }) => boolean>;

    expect(rules['cursor-pointer']({ data: ROW })).toBe(true);
    expect(rules['cursor-pointer']({ data: undefined })).toBe(false);
  });

  // Opening a row is a read, so the grid stays read-only: the change must not have relaxed either.
  test('field-backed columns sort and filter, and the composed rating column does neither', () => {
    const columns = leafColumns(columnDefs);

    expect(columns.length).toBeGreaterThan(0);

    const rating = columns.find((column) => column.field === ConversationColumn.Rating);
    expect(rating?.sortable).toBe(false);
    expect(rating?.filter).toBe(false);

    const conversation = columns.find((column) => column.field === ConversationsField.ChatId);
    expect(conversation?.sortable).not.toBe(false);
    expect(conversation?.filter).not.toBe(false);
  });

  test('rows are served by the datasource, and the view owns the empty state', () => {
    expect(options.datasource).toBeDefined();
    expect(options.suppressNoRowsOverlay).toBe(true);
  });
});
