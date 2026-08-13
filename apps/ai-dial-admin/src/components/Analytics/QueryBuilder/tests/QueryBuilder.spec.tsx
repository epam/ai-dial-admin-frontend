import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import QueryBuilder from '@/src/components/Analytics/QueryBuilder/QueryBuilder';
import {
  executeQuery,
  executeSqlQuery,
  generateQuery,
  getEntitySchema,
  translateQuery,
  translateSqlToQuery,
} from '@/src/app/[lang]/queries/actions';
import { useAppContext } from '@/src/context/AppContext';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { AnalyticsEntity, AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryMode, StructuredQuery } from '@/src/models/analytics/query';
import { TEST_FUNCTIONS } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';

vi.mock('@/src/app/[lang]/queries/actions');

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: vi.fn(() => ({ featureFlags: { deploymentsEnabled: true } })),
}));

const setQueryAssistantEnabled = (enabled: boolean) =>
  vi.mocked(useAppContext).mockReturnValue({ featureFlags: { queryAssistantEnabled: enabled } } as never);

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
    <QueryBuilder
      initialEntities={ENTITIES}
      initialEntityName="dial_usage_log"
      initialFields={FIELDS}
      initialFunctions={TEST_FUNCTIONS}
      {...props}
    />,
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

  test('entering SQL seeds the editor from the backend translation, formatted', async () => {
    const user = userEvent.setup();
    vi.mocked(translateQuery).mockResolvedValue({
      success: true,
      response: { sql: 'SELECT *\nFROM dial_usage_log\nWHERE request_time >= 0' },
    });
    renderBuilder();

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewSql' }));

    const editor = (await screen.findByLabelText('sql-editor')) as HTMLTextAreaElement;
    expect(translateQuery).toHaveBeenCalled();
    // Backend SQL is reformatted (one clause per line) rather than shown as raw text from the response.
    expect(editor.value).toBe('SELECT\n  *\nFROM\n  dial_usage_log\nWHERE\n  request_time >= 0');
  });

  test('a translate failure surfaces the error and leaves the editor empty with Run disabled', async () => {
    const user = userEvent.setup();
    vi.mocked(translateQuery).mockResolvedValue({ success: false, errorMessage: 'include_total not expressible' });
    renderBuilder();

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewSql' }));

    const editor = (await screen.findByLabelText('sql-editor')) as HTMLTextAreaElement;
    expect(editor.value).toBe('');
    expect(screen.getByText('include_total not expressible')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /QueryBuilder.Run/ })).toBeDisabled();
  });

  test('preserves edited SQL across SQL ⇄ JSON switches without a prompt', async () => {
    const user = userEvent.setup();
    vi.mocked(translateQuery).mockResolvedValue({ success: true, response: { sql: 'SELECT * FROM dial_usage_log' } });
    renderBuilder();

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewSql' }));
    const editor = await screen.findByLabelText('sql-editor');
    await user.clear(editor);
    await user.type(editor, 'SELECT 1');

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewJson' }));
    expect(screen.queryByText('QueryBuilder.DiscardQueryHeader')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewSql' }));
    expect(await screen.findByLabelText('sql-editor')).toHaveValue('SELECT 1');
  });

  test('translatable SQL hydrates the builder without a prompt', async () => {
    const user = userEvent.setup();
    vi.mocked(translateQuery).mockResolvedValue({ success: true, response: { sql: 'SELECT * FROM dial_usage_log' } });
    vi.mocked(translateSqlToQuery).mockResolvedValue({
      success: true,
      response: {
        query: { entity: 'dial_usage_log', mode: 'row', select: [{ expr: { type: 'field', name: 'project_id' } }] },
      },
    });
    renderBuilder();

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewSql' }));
    const editor = await screen.findByLabelText('sql-editor');
    await user.clear(editor);
    await user.type(editor, 'SELECT project_id FROM dial_usage_log');
    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewForm' }));

    // No discard prompt — the SQL was translated and shown in the builder.
    expect(screen.queryByText('QueryBuilder.DiscardQueryHeader')).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'QueryBuilder.Select' })).toBeInTheDocument();
    expect(screen.getByText('project_id')).toBeInTheDocument();
  });

  test('SQL that cannot be translated → Builder prompts; cancel keeps the buffer intact', async () => {
    const user = userEvent.setup();
    vi.mocked(translateQuery).mockResolvedValue({ success: true, response: { sql: 'SELECT * FROM dial_usage_log' } });
    vi.mocked(translateSqlToQuery).mockResolvedValue({ success: false, errorMessage: 'unsupported construct' });
    renderBuilder();

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewSql' }));
    const editor = await screen.findByLabelText('sql-editor');
    await user.clear(editor);
    await user.type(editor, 'SELECT bad');
    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewForm' }));

    expect(await screen.findByText('QueryBuilder.DiscardQueryHeader')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Buttons.Cancel' }));

    expect(screen.getByLabelText('sql-editor')).toHaveValue('SELECT bad');
  });

  test('confirming the prompt discards the untranslatable SQL and resets the builder', async () => {
    const user = userEvent.setup();
    vi.mocked(translateQuery).mockResolvedValue({ success: true, response: { sql: 'SELECT * FROM dial_usage_log' } });
    vi.mocked(translateSqlToQuery).mockResolvedValue({ success: false });
    renderBuilder();

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewSql' }));
    const editor = await screen.findByLabelText('sql-editor');
    await user.clear(editor);
    await user.type(editor, 'SELECT bad');
    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewForm' }));
    await user.click(await screen.findByRole('button', { name: 'Buttons.Discard' }));

    expect(screen.getByRole('heading', { name: 'QueryBuilder.Filter' })).toBeInTheDocument();
  });

  test('unedited (generated) SQL switches to Builder silently', async () => {
    const user = userEvent.setup();
    vi.mocked(translateQuery).mockResolvedValue({ success: true, response: { sql: 'SELECT * FROM dial_usage_log' } });
    renderBuilder();

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewSql' }));
    await screen.findByLabelText('sql-editor');
    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewForm' }));

    expect(screen.queryByText('QueryBuilder.DiscardQueryHeader')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'QueryBuilder.Filter' })).toBeInTheDocument();
    expect(translateSqlToQuery).not.toHaveBeenCalled();
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

  test('labeled field shows its label on the Select chip while the query keeps the raw name', async () => {
    const user = userEvent.setup();
    vi.mocked(executeQuery).mockResolvedValue({ success: true, response: { columns: [], rows: [] } });
    const labeledFields: AnalyticsEntityField[] = [
      ...FIELDS.filter((f) => f.name !== 'project_id'),
      {
        name: 'project_id',
        type: AnalyticsFieldType.String,
        source: 'project_id',
        tag: 'lineage',
        display_name: 'Project',
        description: 'Owning project of the request',
      },
    ];
    renderBuilder({ initialFields: labeledFields });

    await user.click(screen.getByRole('button', { name: 'QueryBuilder.Select: QueryBuilder.AddField' }));
    await user.click(screen.getByRole('button', { name: /lineage/ }));
    await user.click(screen.getByRole('option', { name: /Project/ }));

    // The chip renders the display label, not the raw field name. Multi-select leaves the overlay
    // open, so the chip is identified by its own remove action rather than by matching label text.
    expect(screen.getByRole('button', { name: /Remove Project/ })).toBeInTheDocument();
    expect(screen.queryByText('project_id')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /QueryBuilder.Run/ }));
    const sent = vi.mocked(executeQuery).mock.calls[0][0] as StructuredQuery;
    expect(sent.select).toEqual([{ expr: { type: 'field', name: 'project_id' } }]);
  });
});

describe('QueryBuilder AI view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('offers the AI view only when the query assistant is enabled', () => {
    setQueryAssistantEnabled(false);
    const { unmount } = renderBuilder();
    expect(screen.queryByRole('tab', { name: 'QueryBuilder.ViewAi' })).not.toBeInTheDocument();
    unmount();

    setQueryAssistantEnabled(true);
    renderBuilder();
    expect(screen.getByRole('tab', { name: 'QueryBuilder.ViewAi' })).toBeInTheDocument();
  });

  test('toolbar Run and Copy are hidden while the AI view is active; entity and time controls remain', async () => {
    const user = userEvent.setup();
    setQueryAssistantEnabled(true);
    renderBuilder();
    expect(screen.getByRole('button', { name: /QueryBuilder.Run/ })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewAi' }));

    expect(screen.queryByRole('button', { name: 'QueryBuilder.Run' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Buttons.Copy' })).not.toBeInTheDocument();
    expect(screen.getByText(/dial_usage_log/)).toBeInTheDocument();
    expect(screen.getByText(/Telemetry.TimePeriod/)).toBeInTheDocument();
  });

  // Sends one message in the AI view and returns the inline Run button of the assistant's reply.
  const sendMessage = async (user: ReturnType<typeof userEvent.setup>, content: string) => {
    vi.mocked(generateQuery).mockResolvedValue({
      success: true,
      response: { choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content } }] },
    } as never);
    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewAi' }));
    await user.type(screen.getByRole('textbox', { name: 'QueryBuilder.AiPanelHeading' }), 'cost by deployment');
    await user.click(screen.getByRole('button', { name: 'QueryBuilder.AiSend' }));
    return screen.findByRole('button', { name: 'QueryBuilder.Run' });
  };

  test('a non-representable message runs via SQL and its Run action disables once it is the loaded query', async () => {
    const user = userEvent.setup();
    setQueryAssistantEnabled(true);
    vi.mocked(translateSqlToQuery).mockResolvedValue({ success: false, status: 400 } as never);
    vi.mocked(executeSqlQuery).mockResolvedValue({ success: true, response: { rows: [] } } as never);

    renderBuilder();
    const runButton = await sendMessage(user, '```sql\nSELECT 1\n```');
    await user.click(runButton);

    expect(executeSqlQuery).toHaveBeenCalledWith('SELECT 1');
    await vi.waitFor(() => expect(runButton).toBeDisabled());
  });

  test('a representable message run hydrates the builder and shows in the JSON view', async () => {
    const user = userEvent.setup();
    setQueryAssistantEnabled(true);
    vi.mocked(translateSqlToQuery).mockResolvedValue({
      success: true,
      response: {
        query: {
          entity: 'dial_usage_log',
          mode: QueryMode.Row,
          filter: {
            op: 'and',
            args: [
              {
                op: 'eq',
                args: [
                  { type: 'field', name: 'project_id' },
                  { type: 'value', value_type: 'string', value: 'p1' },
                ],
              },
            ],
          },
        },
      },
    } as never);
    vi.mocked(executeQuery).mockResolvedValue({ success: true, response: { rows: [] } } as never);

    renderBuilder();
    const runButton = await sendMessage(user, '```sql\nSELECT 1 WHERE project_id = ~p1~\n```');
    await user.click(runButton);

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewJson' }));
    const jsonEditor = (await screen.findByRole('textbox', { name: 'json-editor' })) as HTMLTextAreaElement;
    await vi.waitFor(() => expect(jsonEditor.value).toContain('p1'));
  });

  test('running a representable message executes the structured builder query, not SQL', async () => {
    const user = userEvent.setup();
    setQueryAssistantEnabled(true);
    vi.mocked(translateSqlToQuery).mockResolvedValue({
      success: true,
      response: { query: { entity: 'dial_usage_log', mode: QueryMode.Row } },
    } as never);
    vi.mocked(executeQuery).mockResolvedValue({ success: true, response: { rows: [] } } as never);

    renderBuilder();
    const runButton = await sendMessage(user, '```sql\nSELECT 1\n```');
    await user.click(runButton);

    expect(executeQuery).toHaveBeenCalled();
    expect(executeSqlQuery).not.toHaveBeenCalled();
  });

  test('a message targeting another entity refreshes the schema so the time bound uses the right timestamp field', async () => {
    // Repro for the `unknown field 'source_name_8'` error: the page loads a first entity whose
    // timestamp column is named differently, then the AI generates a query for a *different* entity.
    // Without re-fetching the schema, the toolbar time bound resolves against the stale entity's
    // timestamp column (source_name_8) — a field the queried entity doesn't have.
    const user = userEvent.setup();
    setQueryAssistantEnabled(true);
    vi.mocked(getEntitySchema).mockResolvedValue({
      fields: [{ name: 'request_time', type: AnalyticsFieldType.Timestamp, source: 'request_time' }],
    });
    vi.mocked(translateSqlToQuery).mockResolvedValue({
      success: true,
      response: { query: { entity: 'dial_usage_log', mode: QueryMode.Row } },
    } as never);
    vi.mocked(executeQuery).mockResolvedValue({ success: true, response: { rows: [] } } as never);

    renderBuilder({
      initialEntities: [{ name: 'custom_source' }, { name: 'dial_usage_log' }],
      initialEntityName: 'custom_source',
      initialFields: [{ name: 'source_name_8', type: AnalyticsFieldType.Timestamp, source: 'source_name_8' }],
    });
    const runButton = await sendMessage(user, '```sql\nSELECT 1\n```');
    await user.click(runButton);

    expect(getEntitySchema).toHaveBeenCalledWith('dial_usage_log');
    const sent = vi.mocked(executeQuery).mock.calls[0][0] as StructuredQuery;
    expect(sent.entity).toBe('dial_usage_log');
    const args = (sent.filter as { args: { op: string; args: { name?: string }[] }[] }).args;
    expect(args.map((a) => a.op)).toEqual(['ge', 'le']);
    expect(args[0].args[0].name).toBe('request_time');

    // Hydrating a query for a *different* entity than the one currently selected changes
    // `state.entityName` as a side effect — the AI conversation must survive that, not be wiped as if
    // the user had manually switched entities (regression: AiPanel used to be keyed by entityName).
    await vi.waitFor(() => expect(runButton).toBeDisabled());
    expect(screen.getByText('SELECT 1')).toBeInTheDocument();
    expect(JSON.stringify(sent)).not.toContain('source_name_8');
  });

  test('a follow-up reply without SQL does not disturb a previously loaded query', async () => {
    const user = userEvent.setup();
    setQueryAssistantEnabled(true);
    vi.mocked(translateSqlToQuery).mockResolvedValue({ success: false, status: 400 } as never);

    renderBuilder();
    const runButton = await sendMessage(user, '```sql\nSELECT 1\n```');
    await user.click(runButton);
    await vi.waitFor(() => expect(runButton).toBeDisabled());

    vi.mocked(generateQuery).mockResolvedValue({
      success: true,
      response: {
        choices: [
          {
            index: 0,
            finish_reason: 'stop',
            message: { role: 'assistant', content: 'Which project should I filter by?' },
          },
        ],
      },
    } as never);
    await user.type(screen.getByRole('textbox', { name: 'QueryBuilder.AiPanelHeading' }), 'more detail');
    await user.click(screen.getByRole('button', { name: 'QueryBuilder.AiSend' }));

    expect(await screen.findByText('Which project should I filter by?')).toBeInTheDocument();
    expect(runButton).toBeDisabled();
  });

  test('running an earlier message re-enables it, disables the newly-run one, and moves execution back to it', async () => {
    const user = userEvent.setup();
    setQueryAssistantEnabled(true);
    vi.mocked(translateSqlToQuery).mockResolvedValue({ success: false, status: 400 } as never);
    vi.mocked(executeSqlQuery).mockResolvedValue({ success: true, response: { rows: [] } } as never);

    renderBuilder();
    const firstRun = await sendMessage(user, '```sql\nSELECT 1\n```');
    await user.click(firstRun);
    await vi.waitFor(() => expect(firstRun).toBeDisabled());

    vi.mocked(generateQuery).mockResolvedValue({
      success: true,
      response: {
        choices: [
          { index: 0, finish_reason: 'stop', message: { role: 'assistant', content: '```sql\nSELECT 2\n```' } },
        ],
      },
    } as never);
    await user.type(screen.getByRole('textbox', { name: 'QueryBuilder.AiPanelHeading' }), 'now by project');
    await user.click(screen.getByRole('button', { name: 'QueryBuilder.AiSend' }));
    await screen.findByText('SELECT 2');
    const runButtons = screen.getAllByRole('button', { name: 'QueryBuilder.Run' });
    expect(runButtons).toHaveLength(2);

    // Loading the second message re-enables the first (it's no longer the current one).
    await user.click(runButtons[1]);
    await vi.waitFor(() => expect(runButtons[1]).toBeDisabled());
    expect(firstRun).toBeEnabled();

    // Clicking the first message's Run again moves execution back to it.
    await user.click(firstRun);

    expect(executeSqlQuery).toHaveBeenLastCalledWith('SELECT 1');
    await vi.waitFor(() => expect(firstRun).toBeDisabled());
    expect(runButtons[1]).toBeEnabled();
  });

  test('changing the entity clears the conversation and the loaded query', async () => {
    const user = userEvent.setup();
    setQueryAssistantEnabled(true);
    vi.mocked(translateSqlToQuery).mockResolvedValue({ success: false, status: 400 } as never);
    vi.mocked(executeSqlQuery).mockResolvedValue({ success: true, response: { rows: [] } } as never);
    vi.mocked(getEntitySchema).mockResolvedValue({ fields: FIELDS });

    renderBuilder({ initialEntities: [{ name: 'dial_usage_log' }, { name: 'feedback' }] });
    const runButton = await sendMessage(user, '```sql\nSELECT 1\n```');
    await user.click(runButton);
    await vi.waitFor(() => expect(runButton).toBeDisabled());

    await user.click(screen.getByRole('button', { name: /dial_usage_log/ }));
    await user.click(await screen.findByRole('option', { name: 'feedback' }));

    expect(screen.queryByText('SELECT 1')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'QueryBuilder.Run' })).not.toBeInTheDocument();
  });
});
