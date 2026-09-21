import { render } from '@testing-library/react';
import { CellClickedEvent, CellKeyDownEvent, ColDef, ColGroupDef, GridOptions } from 'ag-grid-community';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useRouter } from 'next/navigation';

import SessionsList from '@/src/components/Analytics/SessionsTrace/List/SessionsList';
import { sessionDetailHref } from '@/src/components/Analytics/SessionsTrace/utils';
import { SessionColumn, SessionRow, SessionsField } from '@/src/models/analytics/sessions-trace';

type Column = ColDef<SessionRow> | ColGroupDef<SessionRow>;

let options: GridOptions<SessionRow> = {};
let columnDefs: Column[] = [];

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: (props: { additionalGridOptions?: GridOptions<SessionRow>; columnDefs?: Column[] }) => {
    options = props.additionalGridOptions ?? {};
    columnDefs = props.columnDefs ?? [];
    return <section aria-label="grid" />;
  },
}));

// Deliberately not `ColDef<SessionRow>`: a leaf can be a composed column (the rating cell) whose
// `field` is not a key of the row, and the row-typed `field` would make that comparison impossible.
const leafColumns = (columns: Column[]): ColDef[] =>
  columns.flatMap((column) => ('children' in column ? leafColumns(column.children as Column[]) : [column as ColDef]));

const CHAT_ID = 'sessions/eRxsos/chathub-claude4__E2E';

const ROW = { client_session_id: CHAT_ID } as SessionRow;

const push = vi.fn();
const open = vi.fn();

// `data` is passed positionally rather than defaulted: an explicit `undefined` argument would fall back to
// a default value, so the no-data case would silently test the populated one.
const clickEvent = (event: Partial<MouseEvent>, data?: SessionRow) =>
  ({ data, event }) as unknown as CellClickedEvent<SessionRow>;

const keyEvent = (key: string, data?: SessionRow) =>
  ({ data, event: { key } }) as unknown as CellKeyDownEvent<SessionRow>;

beforeEach(() => {
  vi.clearAllMocks();
  options = {};
  (useRouter as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ push });
  vi.stubGlobal('open', open);
  render(
    <SessionsList
      datasource={{ getRows: vi.fn() }}
      gridContext={{ requestFieldValues: vi.fn() }}
      onGridReady={vi.fn()}
      isColumnsPanelOpen={false}
      onToggleColumnsPanel={vi.fn()}
    />,
  );
});

describe('sessions list row navigation', () => {
  test('opening a row navigates to the encoded detail address', () => {
    options.onCellClicked?.(clickEvent({ ctrlKey: false, metaKey: false, button: 0 }, ROW));

    expect(push).toHaveBeenCalledWith(sessionDetailHref(CHAT_ID));
  });

  test('the encoded address keeps the id as a single path segment', () => {
    expect(sessionDetailHref(CHAT_ID)).toBe(`/sessions/${encodeURIComponent(CHAT_ID)}`);
    expect(sessionDetailHref(CHAT_ID)).not.toContain(`/${CHAT_ID}`);
  });

  test('the new-tab modifier opens a tab instead of navigating', () => {
    options.onCellClicked?.(clickEvent({ metaKey: true }, ROW));

    expect(open).toHaveBeenCalledWith(sessionDetailHref(CHAT_ID), '_blank');
    expect(push).not.toHaveBeenCalled();
  });

  test('Enter on a focused cell reaches the same destination as a click', () => {
    options.onCellKeyDown?.(keyEvent('Enter', ROW));

    expect(push).toHaveBeenCalledWith(sessionDetailHref(CHAT_ID));
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
    const rules = options.rowClassRules as Record<string, (params: { data?: SessionRow }) => boolean>;

    expect(rules['cursor-pointer']({ data: ROW })).toBe(true);
    expect(rules['cursor-pointer']({ data: undefined })).toBe(false);
  });

  // Opening a row is a read, so the grid stays read-only: the change must not have relaxed either.
  test('field-backed columns sort and filter, and the composed rating column does neither', () => {
    const columns = leafColumns(columnDefs);

    expect(columns.length).toBeGreaterThan(0);

    const rating = columns.find((column) => column.field === SessionColumn.Rating);
    expect(rating?.sortable).toBe(false);
    expect(rating?.filter).toBe(false);

    const session = columns.find((column) => column.field === SessionsField.ChatId);
    expect(session?.sortable).not.toBe(false);
    expect(session?.filter).not.toBe(false);
  });

  test('rows are served by the datasource, and the view owns the empty state', () => {
    expect(options.datasource).toBeDefined();
    expect(options.suppressNoRowsOverlay).toBe(true);
  });
});
