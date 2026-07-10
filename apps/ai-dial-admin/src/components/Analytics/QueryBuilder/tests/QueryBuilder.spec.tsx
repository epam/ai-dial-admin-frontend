import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import QueryBuilder from '@/src/components/Analytics/QueryBuilder/QueryBuilder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { AnalyticsEntity, AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';

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
];

const renderBuilder = (props?: Partial<Parameters<typeof QueryBuilder>[0]>) =>
  render(
    <QueryBuilder initialEntities={ENTITIES} initialEntityName="dial_usage_log" initialFields={FIELDS} {...props} />,
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe('QueryBuilder', () => {
  test('renders the builder for the server-provided schema', () => {
    renderBuilder();

    expect(screen.getByText(QueryBuilderI18nKey.Mode)).toBeInTheDocument();
    expect(screen.getByText('event_id')).toBeInTheDocument();
    expect(screen.getByText('project_id')).toBeInTheDocument();
  });

  test('projection tag filter narrows visible fields without changing selection', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByText('event_id'));
    await user.click(screen.getByText('lineage'));

    await waitFor(() => expect(screen.queryByText('event_id')).not.toBeInTheDocument());
    expect(screen.getByText('project_id')).toBeInTheDocument();
  });

  test('enables the header Run button when a schema is loaded', () => {
    renderBuilder();

    expect(screen.getByRole('button', { name: QueryBuilderI18nKey.Run })).toBeEnabled();
  });

  test('shows the empty state when no entities were provided', () => {
    renderBuilder({ initialEntities: [], initialEntityName: '', initialFields: [] });

    expect(screen.getByText(QueryBuilderI18nKey.EntitiesLoadFailed)).toBeInTheDocument();
    expect(screen.queryByText(QueryBuilderI18nKey.Mode)).not.toBeInTheDocument();
  });

  test('offers Form, JSON and SQL view options once a schema is loaded', () => {
    renderBuilder();

    expect(screen.getByText(QueryBuilderI18nKey.ViewForm)).toBeInTheDocument();
    expect(screen.getByText(QueryBuilderI18nKey.ViewJson)).toBeInTheDocument();
    expect(screen.getByText(QueryBuilderI18nKey.ViewSql)).toBeInTheDocument();
  });

  test('switching to SQL shows the editor and hides the builder sections', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByText(QueryBuilderI18nKey.ViewSql));

    expect(screen.getByLabelText('sql-editor')).toBeInTheDocument();
    expect(screen.getByText(QueryBuilderI18nKey.Source)).toBeInTheDocument();
    expect(screen.queryByText(QueryBuilderI18nKey.Mode)).not.toBeInTheDocument();
  });

  test('preserves the SQL buffer across view switches while keeping form state', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByText(QueryBuilderI18nKey.ViewSql));
    await user.type(screen.getByLabelText('sql-editor'), 'SELECT event_id FROM dial_usage_log');

    await user.click(screen.getByText(QueryBuilderI18nKey.ViewForm));
    expect(screen.getByText(QueryBuilderI18nKey.Mode)).toBeInTheDocument();

    await user.click(screen.getByText(QueryBuilderI18nKey.ViewSql));
    expect(screen.getByLabelText('sql-editor')).toHaveValue('SELECT event_id FROM dial_usage_log');
  });

  test('disables Run for empty SQL and enables it once SQL is entered', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByText(QueryBuilderI18nKey.ViewSql));
    expect(screen.getByRole('button', { name: QueryBuilderI18nKey.Run })).toBeDisabled();

    await user.type(screen.getByLabelText('sql-editor'), 'SELECT 1');
    expect(screen.getByRole('button', { name: QueryBuilderI18nKey.Run })).toBeEnabled();
  });
});
