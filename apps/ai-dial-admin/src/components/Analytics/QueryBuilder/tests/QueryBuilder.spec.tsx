import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import QueryBuilder from '@/src/components/Analytics/QueryBuilder/QueryBuilder';
import { executeQuery } from '@/src/app/[lang]/query-builder/actions';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { AnalyticsEntity, AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { StructuredQuery } from '@/src/models/analytics/query';

vi.mock('@/src/app/[lang]/query-builder/actions');

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ rowData }: { rowData?: unknown[] }) => <div>grid rows: {rowData?.length ?? 0}</div>,
}));

// Mock the Monaco-backed SQL editor with a plain textarea so view/buffer behavior is testable
// without booting Monaco (testing rule §4.5).
vi.mock('@/src/components/Analytics/QueryBuilder/Sql/SqlEditor', () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea aria-label="sql-editor" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

const ENTITIES: AnalyticsEntity[] = [{ name: 'dial_usage_log' }];
const FIELDS: AnalyticsEntityField[] = [
  { name: 'event_id', type: AnalyticsFieldType.Uuid, source: 'event_id', tag: 'identity' },
  { name: 'project_id', type: AnalyticsFieldType.String, source: 'project_id', tag: 'lineage' },
  { name: 'request_time', type: AnalyticsFieldType.Timestamp, source: 'request_time', tag: 'identity' },
];

const renderBuilder = (props?: Partial<Parameters<typeof QueryBuilder>[0]>) =>
  render(
    <QueryBuilder initialEntities={ENTITIES} initialEntityName="dial_usage_log" initialFields={FIELDS} {...props} />,
  );

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('QueryBuilder', () => {
  test('renders toolbar, results empty state, and the builder rail with the form', () => {
    renderBuilder();

    expect(screen.getByText(/dial_usage_log/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /QueryBuilder.Run/ })).toBeEnabled();
    expect(screen.getByText('QueryBuilder.ResultsEmptyTitle')).toBeInTheDocument();
    expect(screen.getByText(QueryBuilderI18nKey.Mode)).toBeInTheDocument();
    expect(screen.getByText('event_id')).toBeInTheDocument();
  });

  test('shows the empty state when no entities were provided', () => {
    renderBuilder({ initialEntities: [], initialEntityName: '', initialFields: [] });

    expect(screen.getByText(QueryBuilderI18nKey.EntitiesLoadFailed)).toBeInTheDocument();
    expect(screen.queryByText(QueryBuilderI18nKey.Mode)).not.toBeInTheDocument();
  });

  test('projection tag filter narrows visible fields without changing selection', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByText('event_id'));
    await user.click(screen.getByText('lineage'));

    await waitFor(() => expect(screen.queryByText('event_id')).not.toBeInTheDocument());
    expect(screen.getByText('project_id')).toBeInTheDocument();
  });

  test('offers Form, JSON and SQL views in the rail once a schema is loaded', () => {
    renderBuilder();

    expect(screen.getByRole('tab', { name: QueryBuilderI18nKey.ViewForm })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: QueryBuilderI18nKey.ViewJson })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: QueryBuilderI18nKey.ViewSql })).toBeInTheDocument();
  });

  test('rail collapse hides the rail, shows the vertical strip, and persists', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('button', { name: 'QueryBuilder.CollapsePanel' }));

    expect(screen.queryByRole('tab', { name: QueryBuilderI18nKey.ViewForm })).not.toBeInTheDocument();
    expect(localStorage.getItem('query-builder-rail-collapsed')).toBe('true');

    await user.click(screen.getByRole('button', { name: /QueryBuilder.OpenPanel/ }));
    expect(screen.getByRole('tab', { name: QueryBuilderI18nKey.ViewForm })).toBeInTheDocument();
    expect(localStorage.getItem('query-builder-rail-collapsed')).toBe('false');
  });

  test('preserves the SQL buffer across view switches while keeping form state', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('tab', { name: QueryBuilderI18nKey.ViewSql }));
    await user.type(screen.getByLabelText('sql-editor'), 'SELECT 1');

    await user.click(screen.getByRole('tab', { name: QueryBuilderI18nKey.ViewForm }));
    expect(screen.getByText(QueryBuilderI18nKey.Mode)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: QueryBuilderI18nKey.ViewSql }));
    expect(screen.getByLabelText('sql-editor')).toHaveValue('SELECT 1');
  });

  test('disables Run for empty SQL and enables it once SQL is entered', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('tab', { name: QueryBuilderI18nKey.ViewSql }));
    expect(screen.getByRole('button', { name: /QueryBuilder.Run/ })).toBeDisabled();

    await user.type(screen.getByLabelText('sql-editor'), 'SELECT 1');
    expect(screen.getByRole('button', { name: /QueryBuilder.Run/ })).toBeEnabled();
  });

  test('running from the Builder sends a structured query with the toolbar time bound and renders results', async () => {
    const user = userEvent.setup();
    vi.mocked(executeQuery).mockResolvedValue({
      success: true,
      response: { rows: [{ event_id: '1' }] },
    });
    renderBuilder();

    await user.click(screen.getByRole('button', { name: /QueryBuilder.Run/ }));

    expect(executeQuery).toHaveBeenCalledTimes(1);
    const sent = vi.mocked(executeQuery).mock.calls[0][0] as StructuredQuery;
    expect(sent.entity).toBe('dial_usage_log');
    const args = (sent.filter as { args: { op: string; args: { name?: string }[] }[] }).args;
    expect(args.map((a) => a.op)).toEqual(['ge', 'le']);
    expect(args[0].args[0].name).toBe('request_time');

    expect(await screen.findByText('grid rows: 1')).toBeInTheDocument();
  });
});
