import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import QueriesList from '@/src/components/Analytics/Queries/List/QueriesList';
import { useAppContext } from '@/src/context/AppContext';
import { AnalyticsEntity } from '@/src/models/analytics/entity';
import { QueryExprType, QueryLogicalOperator, QueryMode, QueryOperator } from '@/src/models/analytics/query';
import { QueryResultView } from '@/src/models/analytics/query-builder';
import { SavedQuery, SavedQueryScope } from '@/src/models/analytics/saved-query';

vi.mock('@/src/app/[lang]/queries/actions');

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: vi.fn(() => ({ isFullAdmin: true })),
}));

const setFullAdmin = (isFullAdmin: boolean) => vi.mocked(useAppContext).mockReturnValue({ isFullAdmin } as never);

interface GridProps {
  rowData?: SavedQuery[] | null;
  columnDefs?: {
    colId?: string;
    field?: string;
    headerName?: string;
    valueGetter?: (params: { data: SavedQuery }) => unknown;
    cellRendererParams?: { items: { id: string; onClick: (entity?: SavedQuery) => void; hidden?: unknown }[] };
  }[];
  emptyDataProps?: { title?: string };
}

let lastGrid: GridProps = {};

vi.mock('@/src/components/ListView/List', () => ({
  default: ({ children, ...props }: GridProps & { children?: React.ReactNode; listLabel?: string }) => {
    lastGrid = props;
    return (
      <div>
        <span>rows: {props.rowData?.length ?? 0}</span>
        <span>empty: {props.emptyDataProps?.title}</span>
        {children}
      </div>
    );
  },
}));

const ENTITIES: AnalyticsEntity[] = [{ name: 'dial_usage_log' }];

const baseQuery = (overrides: Partial<SavedQuery>): SavedQuery => ({
  id: 'sq_1',
  name: 'Top chats',
  scope: SavedQueryScope.Personal,
  result_view: QueryResultView.Table,
  generation: 1,
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-02T00:00:00Z',
  ...overrides,
});

const PERSONAL = baseQuery({ id: 'sq_1', name: 'Mine', query: { entity: 'dial_usage_log', mode: QueryMode.Row } });
const COMMON = baseQuery({
  id: 'sq_2',
  name: 'Shared',
  scope: SavedQueryScope.Common,
  query: { entity: 'dial_usage_log', mode: QueryMode.Row },
});

const column = (colId: string) => lastGrid.columnDefs?.find((c) => c.colId === colId);
const actions = () => lastGrid.columnDefs?.find((c) => c.cellRendererParams)?.cellRendererParams?.items ?? [];

const renderList = (data: SavedQuery[] = [PERSONAL, COMMON]) => render(<QueriesList data={data} entities={ENTITIES} />);

describe('QueriesList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastGrid = {};
    setFullAdmin(true);
  });

  test('lists queries from both scopes in one grid', () => {
    renderList();

    expect(screen.getByText('rows: 2')).toBeInTheDocument();
  });

  test('shows each row its scope', () => {
    renderList();

    const scope = column('scope');
    expect(scope?.valueGetter?.({ data: PERSONAL })).toBe('Queries.ScopePersonal');
    expect(scope?.valueGetter?.({ data: COMMON })).toBe('Queries.ScopeCommon');
  });

  test('derives the editor column from the body rather than a stored field', () => {
    renderList();
    const editor = column('editor');

    expect(editor?.valueGetter?.({ data: PERSONAL })).toBe('Queries.EditorBuilder');
    expect(editor?.valueGetter?.({ data: baseQuery({ sql: 'SELECT 1' }) })).toBe('Queries.EditorSql');
  });

  test('reports JSON for a body the visual builder cannot represent', () => {
    renderList();

    const deeplyNested = baseQuery({
      query: {
        entity: 'dial_usage_log',
        mode: QueryMode.Row,
        filter: {
          op: QueryLogicalOperator.And,
          args: [
            {
              op: QueryLogicalOperator.Or,
              args: [
                {
                  op: QueryLogicalOperator.And,
                  args: [
                    {
                      op: QueryOperator.Eq,
                      args: [{ type: QueryExprType.Field, name: 'project_id' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    });

    expect(column('editor')?.valueGetter?.({ data: deeplyNested })).toBe('Queries.EditorJson');
  });

  test('falls back to a placeholder when the service recorded no author email', () => {
    renderList();
    const savedBy = column('owner_email');

    expect(savedBy?.valueGetter?.({ data: PERSONAL })).toBe('Queries.SavedByUnknown');
    expect(savedBy?.valueGetter?.({ data: baseQuery({ owner_email: 'jane@example.com' }) })).toBe('jane@example.com');
  });

  test('offers Open in new tab, Edit, and Delete as row actions', () => {
    renderList();

    expect(actions().map((action) => action.id)).toEqual([
      'ActionMenuOperation.Open_in_new_tab',
      'ActionMenuOperation.Edit',
      'ActionMenuOperation.Delete',
    ]);
  });

  test('withholds Edit and Delete on a common query from a caller who cannot write it', () => {
    setFullAdmin(false);
    renderList();

    const [, edit, remove] = actions();
    const commonNode = { data: COMMON } as never;
    const personalNode = { data: PERSONAL } as never;

    expect((edit.hidden as (api: unknown, node: unknown) => boolean)(null, commonNode)).toBe(true);
    expect((remove.hidden as (api: unknown, node: unknown) => boolean)(null, commonNode)).toBe(true);
    expect((edit.hidden as (api: unknown, node: unknown) => boolean)(null, personalNode)).toBe(false);
  });

  test('offers Edit and Delete on a common query to a full administrator', () => {
    setFullAdmin(true);
    renderList();

    const [, edit, remove] = actions();
    const commonNode = { data: COMMON } as never;

    expect((edit.hidden as (api: unknown, node: unknown) => boolean)(null, commonNode)).toBe(false);
    expect((remove.hidden as (api: unknown, node: unknown) => boolean)(null, commonNode)).toBe(false);
  });

  test('shows an empty state when the caller has no visible queries', () => {
    renderList([]);

    expect(screen.getByText('rows: 0')).toBeInTheDocument();
    expect(screen.getByText('empty: Entities.NoQueries')).toBeInTheDocument();
  });

  test('opens the create modal from the Create action', async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(screen.getByRole('button', { name: 'Buttons.Create' }));

    expect(screen.getByText('Queries.CreateQuery')).toBeInTheDocument();
  });

  test('opens the edit modal from a row action, seeded with that query', async () => {
    renderList();

    const [, edit] = actions();
    edit.onClick(COMMON);

    expect(await screen.findByText('Queries.EditQuery')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Shared')).toBeInTheDocument();
  });
});
