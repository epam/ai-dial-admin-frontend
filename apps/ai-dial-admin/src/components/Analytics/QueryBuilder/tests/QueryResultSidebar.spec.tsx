import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi, type Mock } from 'vitest';

import * as actions from '@/src/app/[lang]/query-builder/actions';
import QueryResultSidebar from '@/src/components/Analytics/QueryBuilder/Result/QueryResultSidebar';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { QueryMode, StructuredQuery } from '@/src/models/analytics/query';
import { QueryRequestKind, QueryRunRequest } from '@/src/models/analytics/query-builder';

vi.mock('@/src/app/[lang]/query-builder/actions');
vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ rowData }: { rowData?: unknown[] }) => <div>grid rows: {rowData?.length ?? 0}</div>,
}));

const QUERY: StructuredQuery = { entity: 'dial_usage_log', mode: QueryMode.Row };
const STRUCTURED_REQUEST: QueryRunRequest = { kind: QueryRequestKind.Structured, query: QUERY };
const SQL_REQUEST: QueryRunRequest = { kind: QueryRequestKind.Sql, sql: 'SELECT event_id FROM dial_usage_log' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('QueryResultSidebar', () => {
  test('runs the structured query on mount and renders the result grid with a row count', async () => {
    (actions.executeQuery as Mock).mockResolvedValue({
      success: true,
      response: { columns: ['event_id'], rows: [{ event_id: 'a' }, { event_id: 'b' }] },
    });

    render(<QueryResultSidebar request={STRUCTURED_REQUEST} />);

    expect(await screen.findByText('grid rows: 2')).toBeInTheDocument();
    expect(screen.getByText(QueryBuilderI18nKey.Rows)).toBeInTheDocument();
    expect(actions.executeQuery).toHaveBeenCalledWith(QUERY);
  });

  test('runs a SQL request via executeSqlQuery', async () => {
    (actions.executeSqlQuery as Mock).mockResolvedValue({
      success: true,
      response: { columns: ['event_id'], rows: [{ event_id: 'a' }] },
    });

    render(<QueryResultSidebar request={SQL_REQUEST} />);

    expect(await screen.findByText('grid rows: 1')).toBeInTheDocument();
    expect(actions.executeSqlQuery).toHaveBeenCalledWith(
      SQL_REQUEST.kind === QueryRequestKind.Sql ? SQL_REQUEST.sql : '',
    );
    expect(actions.executeQuery).not.toHaveBeenCalled();
  });

  test('surfaces an error notification when a SQL run fails', async () => {
    (actions.executeSqlQuery as Mock).mockResolvedValue({
      success: false,
      errorHeader: 'bad sql',
      errorMessage: 'unsupported construct',
    });

    render(<QueryResultSidebar request={SQL_REQUEST} />);

    expect(await screen.findByText(QueryBuilderI18nKey.NoRows)).toBeInTheDocument();
  });

  test('shows the empty state when the result has no rows', async () => {
    (actions.executeQuery as Mock).mockResolvedValue({
      success: true,
      response: { columns: [], rows: [] },
    });

    render(<QueryResultSidebar request={STRUCTURED_REQUEST} />);

    expect(await screen.findByText(QueryBuilderI18nKey.NoRows)).toBeInTheDocument();
  });
});
