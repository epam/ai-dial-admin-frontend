import { render, screen } from '@testing-library/react';
import { ColDef, ColGroupDef, GridOptions, ICellRendererParams } from 'ag-grid-community';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import SessionCellRenderer from '@/src/components/Analytics/SessionsTrace/List/SessionCellRenderer';
import SessionsList from '@/src/components/Analytics/SessionsTrace/List/SessionsList';
import { sessionDetailHref } from '@/src/components/Analytics/SessionsTrace/utils';
import { SessionColumn, SessionRow, SessionsField } from '@/src/models/analytics/sessions-trace';

type Column = ColDef<SessionRow> | ColGroupDef<SessionRow>;

let options: GridOptions<SessionRow> = {};
let columnDefs: Column[] = [];
let getHref: ((row?: SessionRow) => string | undefined) | undefined;

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: (props: {
    additionalGridOptions?: GridOptions<SessionRow>;
    columnDefs?: Column[];
    getHref?: (row?: SessionRow) => string | undefined;
  }) => {
    options = props.additionalGridOptions ?? {};
    columnDefs = props.columnDefs ?? [];
    getHref = props.getHref;
    return <section aria-label="grid" />;
  },
}));

// Deliberately not `ColDef<SessionRow>`: a leaf can be a composed column (the rating cell) whose
// `field` is not a key of the row, and the row-typed `field` would make that comparison impossible.
const leafColumns = (columns: Column[]): ColDef[] =>
  columns.flatMap((column) => ('children' in column ? leafColumns(column.children as Column[]) : [column as ColDef]));

const CHAT_ID = 'sessions/eRxsos/chathub-claude4__E2E';

const ROW = { client_session_id: CHAT_ID } as SessionRow;

beforeEach(() => {
  vi.clearAllMocks();
  options = {};
  getHref = undefined;
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
  test('a row click does not navigate', () => {
    expect(options.onCellClicked).toBeUndefined();
    expect(options.onCellKeyDown).toBeUndefined();
  });

  test('the row address is the encoded detail address', () => {
    expect(getHref?.(ROW)).toBe(sessionDetailHref(CHAT_ID));
    expect(getHref?.(undefined)).toBeUndefined();
  });

  test('the encoded address keeps the id as a single path segment', () => {
    expect(sessionDetailHref(CHAT_ID)).toBe(`/sessions/${encodeURIComponent(CHAT_ID)}`);
    expect(sessionDetailHref(CHAT_ID)).not.toContain(`/${CHAT_ID}`);
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
    expect(options.suppressOverlays).toEqual(['noRows', 'noMatchingRows']);
  });
});

describe('SessionCellRenderer', () => {
  const renderCell = (data: Partial<SessionRow>) =>
    render(<SessionCellRenderer {...({ data } as unknown as ICellRendererParams<SessionRow>)} />);

  test('links the session id to its detail address when the session has no title', () => {
    renderCell({ client_session_id: CHAT_ID });

    expect(screen.getByRole('link', { name: CHAT_ID })).toHaveAttribute('href', sessionDetailHref(CHAT_ID));
  });
});
