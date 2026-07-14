import { render, screen } from '@testing-library/react';
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

// Mock the Monaco-backed editors with plain textareas so view/buffer behavior is testable
// without booting Monaco (testing rule §4.5).
vi.mock('@/src/components/Analytics/QueryBuilder/Sql/SqlEditor', () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea aria-label="sql-editor" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

vi.mock('@/src/components/Common/JsonEditorBase/JsonEditorBase', () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string | undefined) => void }) => (
    <textarea aria-label="json-editor" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

const ENTITIES: AnalyticsEntity[] = [{ name: 'dial_usage_log' }];
const FIELDS: AnalyticsEntityField[] = [
  { name: 'event_id', type: AnalyticsFieldType.Uuid, source: 'event_id', tag: 'identity' },
  { name: 'project_id', type: AnalyticsFieldType.String, source: 'project_id', tag: 'lineage' },
  { name: 'request_time', type: AnalyticsFieldType.Timestamp, source: 'request_time', tag: 'identity' },
];

const DEEP_JSON = JSON.stringify({
  entity: 'dial_usage_log',
  mode: 'row',
  filter: {
    op: 'and',
    args: [
      {
        op: 'or',
        args: [
          {
            op: 'and',
            args: [
              {
                op: 'eq',
                args: [
                  { type: 'field', name: 'project_id' },
                  { type: 'value', value_type: 'string', value: 'x' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
});

const renderBuilder = (props?: Partial<Parameters<typeof QueryBuilder>[0]>) =>
  render(
    <QueryBuilder initialEntities={ENTITIES} initialEntityName="dial_usage_log" initialFields={FIELDS} {...props} />,
  );

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('QueryBuilder', () => {
  test('renders toolbar, results empty state, and builder rail sections', () => {
    renderBuilder();

    expect(screen.getByText(/dial_usage_log/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /QueryBuilder.Run/ })).toBeEnabled();
    expect(screen.getByText('QueryBuilder.ResultsEmptyDescription')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'QueryBuilder.AggregateMode' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'QueryBuilder.Filter' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'QueryBuilder.Sort' })).toBeInTheDocument();
  });

  test('shows the empty state when no entities were provided', () => {
    renderBuilder({ initialEntities: [], initialEntityName: '', initialFields: [] });

    expect(screen.getByText('QueryBuilder.EntitiesLoadFailed')).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'QueryBuilder.ViewForm' })).not.toBeInTheDocument();
  });

  test('mode switcher swaps projection and aggregate sections without DISTINCT controls', async () => {
    const user = userEvent.setup();
    renderBuilder();

    expect(screen.getByRole('heading', { name: 'QueryBuilder.Select' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.AggregateMode' }));

    expect(screen.getByRole('heading', { name: /QueryBuilder.GroupBy/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /QueryBuilder\.Aggregate/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /QueryBuilder.Having/ })).toBeInTheDocument();
    // Empty aggregate setup surfaces warning icons on the affected section headers (text in tooltip).
    expect(screen.getAllByLabelText(/QueryBuilder.WarningEmptyAggregate/).length).toBeGreaterThan(0);
    expect(screen.queryByRole('heading', { name: 'QueryBuilder.Select' })).not.toBeInTheDocument();
    expect(screen.queryByText('QueryBuilder.DistinctRows')).not.toBeInTheDocument();
    // The service computes totals only for row-mode offset paging — the toggle hides in aggregate.
    expect(screen.queryByText('QueryBuilder.IncludeTotal')).not.toBeInTheDocument();
  });

  test('nested filter groups offer no add-group action', async () => {
    const user = userEvent.setup();
    renderBuilder();

    // Root offers both actions; adding a group nests one level.
    await user.click(screen.getByRole('button', { name: 'QueryBuilder.AddGroup' }));

    // Still exactly one add-group button (the root one) — the nested group has only add-condition.
    expect(screen.getAllByRole('button', { name: 'QueryBuilder.AddGroup' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'QueryBuilder.AddCondition' }).length).toBeGreaterThan(1);
  });

  test('rail collapse hides the rail, shows the restore button, and persists', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('button', { name: 'QueryBuilder.CollapsePanel' }));

    expect(screen.queryByRole('tab', { name: 'QueryBuilder.ViewForm' })).not.toBeInTheDocument();
    expect(localStorage.getItem('query-builder-rail-collapsed')).toBe('true');

    await user.click(screen.getByRole('button', { name: /QueryBuilder.OpenPanel/ }));
    expect(screen.getByRole('tab', { name: 'QueryBuilder.ViewForm' })).toBeInTheDocument();
    expect(localStorage.getItem('query-builder-rail-collapsed')).toBe('false');
  });

  test('entering SQL seeds the editor with SQL generated from the builder', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewSql' }));

    const sql = (screen.getByLabelText('sql-editor') as HTMLTextAreaElement).value;
    expect(sql).toMatch(/^SELECT/);
    expect(sql).toContain('FROM dial_usage_log');
    expect(sql).toContain('request_time >=');
  });

  test('preserves edited SQL across SQL ⇄ JSON switches without a prompt', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewSql' }));
    await user.clear(screen.getByLabelText('sql-editor'));
    await user.type(screen.getByLabelText('sql-editor'), 'SELECT 1');

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewJson' }));
    expect(screen.queryByText('QueryBuilder.DiscardQueryHeader')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewSql' }));
    expect(screen.getByLabelText('sql-editor')).toHaveValue('SELECT 1');
  });

  test('switching edited SQL → Builder prompts; cancel stays with the buffer intact', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewSql' }));
    await user.clear(screen.getByLabelText('sql-editor'));
    await user.type(screen.getByLabelText('sql-editor'), 'SELECT 1');
    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewForm' }));

    expect(screen.getByText('QueryBuilder.DiscardQueryHeader')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Buttons.Cancel' }));

    expect(screen.getByLabelText('sql-editor')).toHaveValue('SELECT 1');
  });

  test('confirming the prompt discards the edited SQL and resets the builder', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewSql' }));
    await user.clear(screen.getByLabelText('sql-editor'));
    await user.type(screen.getByLabelText('sql-editor'), 'SELECT 1');
    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewForm' }));
    await user.click(screen.getByRole('button', { name: 'Buttons.Discard' }));

    expect(screen.getByRole('heading', { name: 'QueryBuilder.Filter' })).toBeInTheDocument();

    // Re-entering SQL regenerates from the (reset) builder — the edited text is gone.
    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewSql' }));
    const sql = (screen.getByLabelText('sql-editor') as HTMLTextAreaElement).value;
    expect(sql).not.toBe('SELECT 1');
    expect(sql).toMatch(/^SELECT/);
  });

  test('unedited (generated) SQL switches to Builder silently', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewSql' }));
    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewForm' }));

    expect(screen.queryByText('QueryBuilder.DiscardQueryHeader')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'QueryBuilder.Filter' })).toBeInTheDocument();
  });

  test('unrepresentable JSON keeps Run enabled, flags divergence, and guards Builder switch', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewJson' }));
    const editor = screen.getByLabelText('json-editor');
    await user.clear(editor);
    await user.paste(DEEP_JSON);

    expect(screen.getByText('QueryBuilder.NotShownInBuilder')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /QueryBuilder.Run/ })).toBeEnabled();

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewForm' }));
    expect(screen.getByText('QueryBuilder.DiscardQueryHeader')).toBeInTheDocument();
  });

  test('invalid JSON disables Run with the invalid message', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewJson' }));
    const editor = screen.getByLabelText('json-editor');
    await user.clear(editor);
    await user.paste('{ not json');

    expect(screen.getByText('QueryBuilder.InvalidJson')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /QueryBuilder.Run/ })).toBeDisabled();
  });

  test('running from the Builder sends a structured query with the toolbar time bound', async () => {
    const user = userEvent.setup();
    vi.mocked(executeQuery).mockResolvedValue({
      success: true,
      response: { columns: ['event_id'], rows: [{ event_id: '1' }] },
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
    expect(screen.getByText('QueryBuilder.RowsReturned')).toBeInTheDocument();
  });
});
