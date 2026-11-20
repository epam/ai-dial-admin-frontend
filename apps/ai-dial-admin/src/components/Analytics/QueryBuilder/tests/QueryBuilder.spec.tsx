import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import QueryBuilder from '@/src/components/Analytics/QueryBuilder/QueryBuilder';
import { generateQuery, getEntitySchema, translateQuery, translateSqlToQuery } from '@/src/app/[lang]/queries/actions';
import { useAppContext } from '@/src/context/AppContext';
import { QueriesI18nKey } from '@/src/constants/i18n';
import { AnalyticsEntity, AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import {
  QueryExprType,
  QueryLogicalOperator,
  QueryMode,
  QueryOffsetPage,
  QueryOperator,
  QueryPageType,
  QueryPredicate,
  QueryValueType,
  StructuredQuery,
} from '@/src/models/analytics/query';
import { QueryRequestKind } from '@/src/models/analytics/query-builder';
import { formatSql } from '@/src/components/Analytics/QueryBuilder/utils/sql-format';
import { TEST_FUNCTIONS } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';
import { CsvOutcome, QueryOutcome } from '@/src/components/Analytics/Common/use-analytics-query';
import { downloadFile } from '@/src/utils/download';

const runQueryMock = vi.fn(
  async (_query?: unknown): Promise<QueryOutcome> => ({ isSuccess: true, result: { rows: [] } }),
);
const runSqlMock = vi.fn(async (_sql?: string): Promise<QueryOutcome> => ({ isSuccess: true, result: { rows: [] } }));

// One object for the life of the file: a fresh one per render would change the identity the effects
// depend on and re-issue every read forever.
const exportCsvMock = vi.fn(
  async (_request?: unknown): Promise<CsvOutcome> => ({
    isSuccess: true,
    file: { blob: new Blob(['id\r\n1\r\n']), fileName: 'result.csv' },
  }),
);
const RUNNER = { runQuery: runQueryMock, runSql: runSqlMock, exportCsv: exportCsvMock };
vi.mock('@/src/components/Analytics/Common/use-analytics-query', () => ({
  useAnalyticsQuery: () => RUNNER,
}));

vi.mock('@/src/app/[lang]/queries/actions');
vi.mock('@/src/utils/download');

const { showNotificationMock } = vi.hoisted(() => ({ showNotificationMock: vi.fn() }));

vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: showNotificationMock, removeNotification: vi.fn() }),
}));

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

const ENTITIES: AnalyticsEntity[] = [{ name: 'dial_usage_log' }];
const FIELDS: AnalyticsEntityField[] = [
  { name: 'event_id', type: AnalyticsFieldType.Uuid, source: 'event_id', tag: 'identity' },
  { name: 'project_id', type: AnalyticsFieldType.String, source: 'project_id', tag: 'lineage' },
  { name: 'request_time', type: AnalyticsFieldType.Timestamp, source: 'request_time', tag: 'identity' },
];

const PAGE: QueryOffsetPage = { type: QueryPageType.Offset, offset: 0, limit: 100, include_total: false };

const projectIs = (value: string): QueryPredicate => ({
  op: QueryOperator.Eq,
  args: [
    { type: QueryExprType.Field, name: 'project_id' },
    { type: QueryExprType.Value, value_type: QueryValueType.String, value },
  ],
});

const rowQuery = (extra?: Partial<StructuredQuery>): StructuredQuery => ({
  entity: 'dial_usage_log',
  mode: QueryMode.Row,
  page: PAGE,
  ...extra,
});

const NESTED_QUERY = rowQuery({
  filter: {
    op: QueryLogicalOperator.And,
    args: [{ op: QueryLogicalOperator.Or, args: [projectIs('x'), projectIs('y')] }],
  },
});

const TIME_BOUND = {
  op: QueryLogicalOperator.And,
  args: [
    expect.objectContaining({
      op: QueryOperator.Ge,
      args: [expect.objectContaining({ name: 'request_time' }), expect.anything()],
    }),
    expect.objectContaining({ op: QueryOperator.Le }),
  ],
};

type User = ReturnType<typeof userEvent.setup>;

const openAdd = async (user: User, entry: string) => {
  await user.click(screen.getByRole('button', { name: 'QueryChips.AddPart' }));
  await user.click(await screen.findByRole('menuitemcheckbox', { name: entry }));
  return screen.findByRole('dialog');
};

const apply = (user: User, dialog: HTMLElement) =>
  user.click(within(dialog).getByRole('button', { name: 'Buttons.Apply' }));

const addProjectFilter = async (user: User, value: string) => {
  const dialog = await openAdd(user, 'QueryBuilder.Filter');
  await user.click(within(dialog).getByRole('combobox', { name: /QueryChips.Column/ }));
  await user.click(await screen.findByRole('option', { name: 'project_id' }));
  await user.type(within(dialog).getByRole('textbox', { name: /QueryChips.Value/ }), value);
  await apply(user, dialog);
};

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
  localStorage.setItem('query-builder-chart-panel-open', 'true');
});

describe('QueryBuilder', () => {
  const COPY = /copy/i;

  test('renders the header, view switcher, chip bar, Run and the empty results state', () => {
    renderBuilder();

    expect(screen.getByRole('heading', { level: 1, name: QueriesI18nKey.Title })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: QueriesI18nKey.SaveAsQuery })).toBeEnabled();
    expect(screen.getByRole('radio', { name: 'QueryBuilder.ViewForm' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'QueryBuilder.ViewSql' })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'QueryBuilder.ViewJson' })).toBeNull();

    const bar = screen.getByRole('group', { name: 'QueryChips.Bar' });
    expect(within(bar).getByRole('button', { name: /QueryChips.Period/ })).toBeInTheDocument();
    expect(within(bar).getByRole('button', { name: /QueryBuilder.Limit/ })).toBeInTheDocument();
    expect(within(bar).getByRole('button', { name: 'QueryChips.AddPart' })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /QueryBuilder.Run/ })).toBeEnabled();
    expect(screen.queryByRole('button', { name: COPY })).toBeNull();
    expect(screen.getByText('QueryBuilder.ResultsReadyTitle')).toBeInTheDocument();
  });

  test('offers the parts a query can take from the Add menu', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('button', { name: 'QueryChips.AddPart' }));

    expect(await screen.findByRole('menuitemcheckbox', { name: 'QueryBuilder.Filter' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemcheckbox', { name: 'QueryBuilder.Aggregate' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemcheckbox', { name: 'QueryChips.ShowColumns' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemcheckbox', { name: 'QueryBuilder.Sort' })).toBeInTheDocument();
  });

  test('shows the empty state when no entities were provided', () => {
    renderBuilder({ initialEntities: [], initialEntityName: '', initialFields: [] });

    expect(screen.getByText('QueryBuilder.EntitiesLoadFailed')).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'QueryBuilder.ViewForm' })).not.toBeInTheDocument();
  });

  test('entering SQL seeds the editor from the backend translation, formatted', async () => {
    const user = userEvent.setup();
    vi.mocked(translateQuery).mockResolvedValue({
      success: true,
      response: { sql: 'SELECT *\nFROM dial_usage_log\nWHERE request_time >= 0' },
    });
    renderBuilder();

    await user.click(screen.getByRole('radio', { name: 'QueryBuilder.ViewSql' }));

    const editor = (await screen.findByLabelText('sql-editor')) as HTMLTextAreaElement;
    expect(translateQuery).toHaveBeenCalled();
    // Backend SQL is reformatted (one clause per line) rather than shown as raw text from the response.
    expect(editor.value).toBe('SELECT\n  *\nFROM\n  dial_usage_log\nWHERE\n  request_time >= 0');
    expect(screen.getByRole('button', { name: COPY })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'QueryChips.Bar' })).toBeNull();
  });

  test('a translate failure surfaces the error and leaves the editor empty with Run disabled', async () => {
    const user = userEvent.setup();
    vi.mocked(translateQuery).mockResolvedValue({ success: false, errorMessage: 'include_total not expressible' });
    renderBuilder();

    await user.click(screen.getByRole('radio', { name: 'QueryBuilder.ViewSql' }));

    const editor = (await screen.findByLabelText('sql-editor')) as HTMLTextAreaElement;
    expect(editor.value).toBe('');
    expect(screen.getByText('include_total not expressible')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /QueryBuilder.Run/ })).toBeDisabled();
  });

  const typeSql = async (user: User, sql: string) => {
    await user.click(screen.getByRole('radio', { name: 'QueryBuilder.ViewSql' }));
    const editor = await screen.findByLabelText('sql-editor');
    await user.clear(editor);
    await user.click(editor);
    await user.paste(sql);
  };

  test('translatable SQL hydrates the builder without a prompt', async () => {
    const user = userEvent.setup();
    vi.mocked(translateQuery).mockResolvedValue({ success: true, response: { sql: 'SELECT * FROM dial_usage_log' } });
    vi.mocked(translateSqlToQuery).mockResolvedValue({
      success: true,
      response: { query: rowQuery({ filter: { op: QueryLogicalOperator.And, args: [projectIs('p1')] } }) },
    });
    renderBuilder();

    await typeSql(user, "SELECT * FROM dial_usage_log WHERE project_id = 'p1'");
    await user.click(screen.getByRole('radio', { name: 'QueryBuilder.ViewForm' }));

    expect(await screen.findByRole('button', { name: /project_id .* 'p1'/ })).toBeInTheDocument();
    expect(screen.queryByText('QueryBuilder.SwitchToBuilderHeader')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('sql-editor')).toBeNull();
  });

  test('SQL that cannot be translated → Builder prompts; cancel keeps the buffer intact', async () => {
    const user = userEvent.setup();
    vi.mocked(translateQuery).mockResolvedValue({ success: true, response: { sql: 'SELECT * FROM dial_usage_log' } });
    vi.mocked(translateSqlToQuery).mockResolvedValue({ success: false, errorMessage: 'unsupported construct' });
    renderBuilder();

    await user.click(screen.getByRole('radio', { name: 'QueryBuilder.ViewSql' }));
    const editor = await screen.findByLabelText('sql-editor');
    await user.clear(editor);
    await user.click(editor);
    await user.paste('SELECT bad');
    await user.click(screen.getByRole('radio', { name: 'QueryBuilder.ViewForm' }));

    expect(await screen.findByText('QueryBuilder.SwitchToBuilderHeader')).toBeInTheDocument();
    expect(screen.getByText('QueryBuilder.SwitchToBuilderDescription')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'QueryBuilder.StayInSql' }));

    expect(screen.getByLabelText('sql-editor')).toHaveValue('SELECT bad');
  });

  // Regression: a renamed column passed the check and hydrated without its alias, and the SQL buffer
  // holding the original text was cleared.
  test('SQL whose translation the builder would hold only in part → Builder prompts instead of hydrating', async () => {
    const user = userEvent.setup();
    vi.mocked(translateQuery).mockResolvedValue({ success: true, response: { sql: 'SELECT * FROM dial_usage_log' } });
    vi.mocked(translateSqlToQuery).mockResolvedValue({
      success: true,
      response: {
        query: rowQuery({ select: [{ expr: { type: QueryExprType.Field, name: 'project_id' }, as: 'project' }] }),
      },
    });
    renderBuilder();

    await typeSql(user, 'SELECT project_id AS project');
    await user.click(screen.getByRole('radio', { name: 'QueryBuilder.ViewForm' }));

    expect(await screen.findByText('QueryBuilder.SwitchToBuilderHeader')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'QueryBuilder.StayInSql' }));
    expect(screen.getByLabelText('sql-editor')).toHaveValue('SELECT project_id AS project');
  });

  test.each([
    ['nests filter groups', NESTED_QUERY],
    ['carries no offset page', { entity: 'dial_usage_log', mode: QueryMode.Row }],
    ['asks for a total', rowQuery({ page: { ...PAGE, include_total: true } })],
    ['is distinct', rowQuery({ distinct: true })],
  ] as [string, StructuredQuery][])(
    'SQL whose translation %s → Builder prompts and keeps the buffer',
    async (_case, query) => {
      const user = userEvent.setup();
      vi.mocked(translateQuery).mockResolvedValue({ success: true, response: { sql: 'SELECT * FROM dial_usage_log' } });
      vi.mocked(translateSqlToQuery).mockResolvedValue({ success: true, response: { query } });
      renderBuilder();

      await typeSql(user, 'SELECT project_id FROM dial_usage_log');
      await user.click(screen.getByRole('radio', { name: 'QueryBuilder.ViewForm' }));

      expect(await screen.findByText('QueryBuilder.SwitchToBuilderHeader')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'QueryBuilder.StayInSql' }));
      expect(screen.getByLabelText('sql-editor')).toHaveValue('SELECT project_id FROM dial_usage_log');
    },
  );

  test('confirming the prompt discards the untranslatable SQL and resets the builder', async () => {
    const user = userEvent.setup();
    vi.mocked(translateQuery).mockResolvedValue({ success: true, response: { sql: 'SELECT * FROM dial_usage_log' } });
    vi.mocked(translateSqlToQuery).mockResolvedValue({ success: false });
    renderBuilder();

    await addProjectFilter(user, 'p1');
    await screen.findByRole('button', { name: /project_id .* 'p1'/ });
    await typeSql(user, 'SELECT bad');
    await user.click(screen.getByRole('radio', { name: 'QueryBuilder.ViewForm' }));
    await user.click(await screen.findByRole('button', { name: 'QueryBuilder.SwitchToBuilder' }));

    expect(await screen.findByRole('group', { name: 'QueryChips.Bar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /project_id/ })).toBeNull();
    expect(screen.queryByText('QueryBuilder.SwitchToBuilderHeader')).toBeNull();

    await user.click(screen.getByRole('radio', { name: 'QueryBuilder.ViewSql' }));
    expect(await screen.findByLabelText('sql-editor')).toHaveDisplayValue(/FROM\s+dial_usage_log/);
  });

  test('unedited (generated) SQL switches to Builder silently', async () => {
    const user = userEvent.setup();
    vi.mocked(translateQuery).mockResolvedValue({ success: true, response: { sql: 'SELECT * FROM dial_usage_log' } });
    renderBuilder();

    await user.click(screen.getByRole('radio', { name: 'QueryBuilder.ViewSql' }));
    await screen.findByLabelText('sql-editor');
    await user.click(screen.getByRole('radio', { name: 'QueryBuilder.ViewForm' }));

    expect(await screen.findByRole('group', { name: 'QueryChips.Bar' })).toBeInTheDocument();
    expect(screen.queryByText('QueryBuilder.SwitchToBuilderHeader')).not.toBeInTheDocument();
    expect(translateSqlToQuery).not.toHaveBeenCalled();
  });

  test('running from the Builder sends a structured query bounded by the period', async () => {
    const user = userEvent.setup();
    runQueryMock.mockResolvedValue({
      isSuccess: true,
      result: { columns: ['event_id'], rows: [{ event_id: '1' }] },
    } as never);
    renderBuilder();

    await user.click(screen.getByRole('button', { name: /QueryBuilder.Run/ }));

    expect(await screen.findByText('grid rows: 1')).toBeInTheDocument();
    expect(screen.getByText('QueryChips.ResultsCount')).toBeInTheDocument();
    expect(runQueryMock).toHaveBeenCalledOnce();
    expect(runQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({ entity: 'dial_usage_log', mode: QueryMode.Row, filter: TIME_BOUND }),
    );
    expect(runSqlMock).not.toHaveBeenCalled();
  });

  test('says the query changed after an edit, and reports the row count again once it runs', async () => {
    const user = userEvent.setup();
    runQueryMock.mockResolvedValue({
      isSuccess: true,
      result: { columns: ['event_id'], rows: [{ event_id: '1' }] },
    } as never);
    renderBuilder();

    await user.click(screen.getByRole('button', { name: /QueryBuilder.Run/ }));
    expect(await screen.findByText('QueryChips.ResultsCount')).toBeInTheDocument();

    await addProjectFilter(user, 'p1');
    expect(await screen.findByText('QueryBuilder.ResultsQueryChanged')).toBeInTheDocument();
    expect(screen.queryByText('QueryChips.ResultsCount')).toBeNull();

    runQueryMock.mockResolvedValue({ isSuccess: true, result: { columns: ['event_id'], rows: [] } } as never);
    await user.click(screen.getByRole('button', { name: /QueryBuilder.Run/ }));

    expect(await screen.findByText('QueryBuilder.NoRows')).toBeInTheDocument();
    expect(screen.getByText('QueryChips.ResultsCount')).toBeInTheDocument();
    expect(screen.queryByText('QueryBuilder.ResultsQueryChanged')).toBeNull();
  });

  test('switching to SQL without editing it does not mark the result as out of date', async () => {
    const user = userEvent.setup();
    vi.mocked(translateQuery).mockResolvedValue({ success: true, response: { sql: 'SELECT 1' } });
    runQueryMock.mockResolvedValue({
      isSuccess: true,
      result: { columns: ['event_id'], rows: [{ event_id: '1' }] },
    } as never);
    renderBuilder();

    await user.click(screen.getByRole('button', { name: /QueryBuilder.Run/ }));
    expect(await screen.findByText('QueryChips.ResultsCount')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'QueryBuilder.ViewSql' }));
    await vi.waitFor(() => expect(translateQuery).toHaveBeenCalled());

    expect(await screen.findByRole('radio', { name: 'QueryBuilder.ViewSql', checked: true })).toBeInTheDocument();
    expect(screen.getByText('QueryChips.ResultsCount')).toBeInTheDocument();
    expect(screen.queryByText('QueryBuilder.ResultsQueryChanged')).toBeNull();
  });

  test('offers no Period chip and sends no time bound when the schema has no timestamp field', async () => {
    const user = userEvent.setup();
    renderBuilder({ initialFields: FIELDS.filter((field) => field.type !== AnalyticsFieldType.Timestamp) });

    expect(screen.queryByRole('button', { name: /QueryChips.Period/ })).toBeNull();
    expect(screen.getByRole('button', { name: /QueryBuilder.Limit/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /QueryBuilder.Run/ }));

    await vi.waitFor(() =>
      expect(runQueryMock).toHaveBeenCalledWith(expect.not.objectContaining({ filter: expect.anything() })),
    );
  });

  test('a filter added from the chip bar reaches the query that Run sends', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await addProjectFilter(user, 'p1');
    expect(await screen.findByRole('button', { name: /project_id .* 'p1'/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /QueryBuilder.Run/ }));

    await vi.waitFor(() =>
      expect(runQueryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ args: expect.arrayContaining([projectIs('p1')]) }),
        }),
      ),
    );
  });

  test('a limit applied from its chip changes the page that Run sends', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('button', { name: /QueryBuilder.Limit/ }));
    const dialog = await screen.findByRole('dialog');
    const rows = within(dialog).getByRole('spinbutton', { name: /QueryChips.Rows/ });
    await user.clear(rows);
    await user.type(rows, '7');
    await apply(user, dialog);
    await user.click(screen.getByRole('button', { name: /QueryBuilder.Run/ }));

    await vi.waitFor(() =>
      expect(runQueryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          page: expect.objectContaining({ type: QueryPageType.Offset, offset: 0, limit: 7 }),
        }),
      ),
    );
  });

  test('a labeled column picked in Show columns is sent by its raw name', async () => {
    const user = userEvent.setup();
    const labeledFields: AnalyticsEntityField[] = FIELDS.map((field) =>
      field.name === 'project_id' ? { ...field, display_name: 'Project' } : field,
    );
    renderBuilder({ initialFields: labeledFields });

    const dialog = await openAdd(user, 'QueryChips.ShowColumns');
    expect(within(dialog).queryByRole('checkbox', { name: 'project_id' })).toBeNull();
    await user.click(within(dialog).getByRole('checkbox', { name: 'Project' }));
    await apply(user, dialog);

    expect(await screen.findByRole('button', { name: /QueryChips.ShowColumns/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /QueryBuilder.Run/ }));

    await vi.waitFor(() =>
      expect(runQueryMock).toHaveBeenCalledWith(
        expect.objectContaining({ select: [{ expr: { type: QueryExprType.Field, name: 'project_id' } }] }),
      ),
    );
  });
});

describe('QueryBuilder — AI panel', () => {
  const AI_PANEL_STORAGE_KEY = 'query-builder-ai-panel-open';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const openAiPanel = async (user: User) => {
    await user.click(screen.getByRole('button', { name: 'QueryBuilder.AiPanelExpand' }));
    return screen.findByRole('complementary', { name: 'QueryBuilder.AskAi' });
  };

  const assistantReply = (content: string) =>
    ({
      success: true,
      response: { choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content } }] },
    }) as never;

  const ask = async (user: User, panel: HTMLElement, prompt: string) => {
    await user.type(within(panel).getByRole('textbox', { name: 'QueryBuilder.AskAi' }), prompt);
    await user.click(within(panel).getByRole('button', { name: 'QueryBuilder.AiSend' }));
  };

  const sendMessage = async (user: User, content: string) => {
    vi.mocked(generateQuery).mockResolvedValue(assistantReply(content));
    const panel = await openAiPanel(user);
    await ask(user, panel, 'cost by deployment');
    const runButton = await within(panel).findByRole('button', { name: 'QueryBuilder.ProposedQueryApply' });
    return { panel, runButton };
  };

  const messageRuns = (panel: HTMLElement) =>
    within(panel).getAllByRole('button', { name: 'QueryBuilder.ProposedQueryApply' });

  test('offers the AI panel only when the query assistant is enabled', () => {
    setQueryAssistantEnabled(false);
    const { unmount } = renderBuilder();
    expect(screen.getByRole('radio', { name: 'QueryBuilder.ViewForm' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'QueryBuilder.AiPanelExpand' })).toBeNull();
    expect(screen.queryByRole('complementary', { name: 'QueryBuilder.AskAi' })).toBeNull();
    unmount();

    setQueryAssistantEnabled(true);
    renderBuilder();
    expect(screen.getByRole('button', { name: 'QueryBuilder.AiPanelExpand' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByRole('complementary', { name: 'QueryBuilder.AskAi' })).toBeNull();
  });

  test('the view switcher offers only Builder and SQL when the query assistant is enabled', () => {
    setQueryAssistantEnabled(true);
    renderBuilder();

    const switcher = screen.getByRole('radiogroup', { name: 'QueryBuilder.ViewSwitcher' });
    expect(within(switcher).getAllByRole('radio')).toHaveLength(2);
    expect(within(switcher).getByRole('radio', { name: 'QueryBuilder.ViewForm' })).toBeInTheDocument();
    expect(within(switcher).getByRole('radio', { name: 'QueryBuilder.ViewSql' })).toBeInTheDocument();
  });

  test('Run and the chip bar stay available while the AI panel is open, and Copy appears in the SQL view only', async () => {
    const user = userEvent.setup();
    setQueryAssistantEnabled(true);
    vi.mocked(translateQuery).mockResolvedValue({ success: true, response: { sql: 'SELECT 1' } });
    renderBuilder();

    const panel = await openAiPanel(user);

    expect(within(panel).getByRole('heading', { name: 'QueryBuilder.AskAi' })).toBeInTheDocument();
    expect(within(panel).getByRole('textbox', { name: 'QueryBuilder.AskAi' })).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'QueryBuilder.AiPanelCollapse' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('button', { name: /QueryBuilder.Run/ })).toBeEnabled();
    expect(screen.getByRole('group', { name: 'QueryChips.Bar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /copy/i })).toBeNull();

    await user.click(screen.getByRole('radio', { name: 'QueryBuilder.ViewSql' }));

    expect(await screen.findByLabelText('sql-editor')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'QueryBuilder.AskAi' })).toBeInTheDocument();
  });

  test('opening and collapsing the AI panel is remembered in localStorage', async () => {
    const user = userEvent.setup();
    setQueryAssistantEnabled(true);
    renderBuilder();

    const panel = await openAiPanel(user);
    expect(localStorage.getItem(AI_PANEL_STORAGE_KEY)).toBe('true');

    await user.click(within(panel).getByRole('button', { name: 'QueryBuilder.AiPanelCollapse' }));

    expect(await screen.findByRole('button', { name: 'QueryBuilder.AiPanelExpand' })).toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'QueryBuilder.AskAi' })).toBeNull();
    expect(localStorage.getItem(AI_PANEL_STORAGE_KEY)).toBe('false');
  });

  test('the AI panel opens on load when it was left open', async () => {
    setQueryAssistantEnabled(true);
    localStorage.setItem(AI_PANEL_STORAGE_KEY, 'true');
    renderBuilder();

    const panel = await screen.findByRole('complementary', { name: 'QueryBuilder.AskAi' });

    expect(within(panel).getByRole('textbox', { name: 'QueryBuilder.AskAi' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'QueryBuilder.AiPanelExpand' })).toBeNull();
  });

  test('a non-representable message runs via SQL, switches to the SQL view and disables its Run action', async () => {
    const user = userEvent.setup();
    setQueryAssistantEnabled(true);
    vi.mocked(translateSqlToQuery).mockResolvedValue({ success: false, status: 400 } as never);
    runSqlMock.mockResolvedValue({ isSuccess: true, result: { rows: [] } } as never);

    renderBuilder();
    const { runButton } = await sendMessage(user, '```sql\nSELECT 1\n```');
    await user.click(runButton);

    expect(await screen.findByRole('radio', { name: 'QueryBuilder.ViewSql', checked: true })).toBeInTheDocument();
    expect(screen.getByLabelText('sql-editor')).toHaveValue(formatSql('SELECT 1'));
    expect(screen.queryByRole('group', { name: 'QueryChips.Bar' })).toBeNull();
    expect(runButton).toBeDisabled();
    expect(runSqlMock).toHaveBeenCalledWith('SELECT 1');
    expect(runQueryMock).not.toHaveBeenCalled();
    expect(translateSqlToQuery).toHaveBeenCalledOnce();
  });

  test('a representable message run hydrates the chips and leaves the view on Builder', async () => {
    const user = userEvent.setup();
    setQueryAssistantEnabled(true);
    vi.mocked(translateSqlToQuery).mockResolvedValue({
      success: true,
      response: { query: rowQuery({ filter: { op: QueryLogicalOperator.And, args: [projectIs('p1')] } }) },
    });
    runQueryMock.mockResolvedValue({ isSuccess: true, result: { rows: [] } } as never);

    renderBuilder();
    const { runButton } = await sendMessage(user, '```sql\nSELECT 1 WHERE project_id = ~p1~\n```');
    await user.click(runButton);

    expect(await screen.findByRole('button', { name: /project_id .* 'p1'/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'QueryBuilder.ViewForm' })).toBeChecked();
    expect(screen.queryByText('QueryBuilder.SwitchToBuilderHeader')).toBeNull();
    expect(runButton).toBeDisabled();
    expect(runQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({ args: expect.arrayContaining([projectIs('p1')]) }),
      }),
    );
    expect(runSqlMock).not.toHaveBeenCalled();
  });

  test('a representable message run from the SQL view switches the view back to Builder', async () => {
    const user = userEvent.setup();
    setQueryAssistantEnabled(true);
    vi.mocked(translateQuery).mockResolvedValue({ success: true, response: { sql: 'SELECT 1' } });
    vi.mocked(translateSqlToQuery).mockResolvedValue({
      success: true,
      response: { query: rowQuery({ filter: { op: QueryLogicalOperator.And, args: [projectIs('p1')] } }) },
    });
    runQueryMock.mockResolvedValue({ isSuccess: true, result: { rows: [] } } as never);

    renderBuilder();
    await user.click(screen.getByRole('radio', { name: 'QueryBuilder.ViewSql' }));
    await screen.findByLabelText('sql-editor');
    const { runButton } = await sendMessage(user, '```sql\nSELECT 1 WHERE project_id = ~p1~\n```');
    await user.click(runButton);

    expect(await screen.findByRole('button', { name: /project_id .* 'p1'/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'QueryBuilder.ViewForm' })).toBeChecked();
    expect(screen.queryByLabelText('sql-editor')).toBeNull();
    expect(runQueryMock).toHaveBeenCalledOnce();
    expect(runSqlMock).not.toHaveBeenCalled();
  });

  test('a representable run clears the SQL buffer, so SQL is seeded from the chips and Builder is reachable without a prompt', async () => {
    const user = userEvent.setup();
    setQueryAssistantEnabled(true);
    vi.mocked(translateSqlToQuery).mockResolvedValue({ success: true, response: { query: rowQuery() } });
    vi.mocked(translateQuery).mockResolvedValue({ success: true, response: { sql: 'SELECT 7' } });
    runQueryMock.mockResolvedValue({ isSuccess: true, result: { rows: [] } } as never);

    renderBuilder();
    const { runButton } = await sendMessage(user, '```sql\nSELECT 1\n```');
    await user.click(runButton);
    await waitFor(() => expect(screen.getByRole('radio', { name: 'QueryBuilder.ViewSql' })).toBeEnabled());

    await user.click(screen.getByRole('radio', { name: 'QueryBuilder.ViewSql' }));
    await waitFor(() => expect(screen.getByLabelText('sql-editor')).toHaveValue(formatSql('SELECT 7')));

    await user.click(screen.getByRole('radio', { name: 'QueryBuilder.ViewForm' }));

    expect(await screen.findByRole('group', { name: 'QueryChips.Bar' })).toBeInTheDocument();
    expect(screen.queryByText('QueryBuilder.SwitchToBuilderHeader')).toBeNull();
    expect(translateSqlToQuery).toHaveBeenCalledOnce();
    expect(runSqlMock).not.toHaveBeenCalled();
  });

  test('a message targeting another entity refreshes the schema so the time bound uses the right timestamp field', async () => {
    const user = userEvent.setup();
    setQueryAssistantEnabled(true);
    vi.mocked(getEntitySchema).mockResolvedValue({
      success: true,
      response: { fields: [{ name: 'request_time', type: AnalyticsFieldType.Timestamp, source: 'request_time' }] },
    });
    vi.mocked(translateSqlToQuery).mockResolvedValue({
      success: true,
      response: { query: rowQuery() },
    });
    runQueryMock.mockResolvedValue({ isSuccess: true, result: { rows: [] } } as never);

    renderBuilder({
      initialEntities: [{ name: 'custom_source' }, { name: 'dial_usage_log' }],
      initialEntityName: 'custom_source',
      initialFields: [{ name: 'source_name_8', type: AnalyticsFieldType.Timestamp, source: 'source_name_8' }],
    });
    const { panel, runButton } = await sendMessage(user, '```sql\nSELECT 1\n```');
    await user.click(runButton);
    await waitFor(() => expect(screen.getByRole('radio', { name: 'QueryBuilder.ViewSql' })).toBeEnabled());

    expect(getEntitySchema).toHaveBeenCalledWith('dial_usage_log');
    expect(runQueryMock).toHaveBeenCalledOnce();
    const sent = runQueryMock.mock.calls[0][0] as StructuredQuery;
    expect(sent.entity).toBe('dial_usage_log');
    const args = (sent.filter as { args: { op: string; args: { name?: string }[] }[] }).args;
    expect(args.map((a) => a.op)).toEqual(['ge', 'le']);
    expect(args[0].args[0].name).toBe('request_time');
    expect(JSON.stringify(sent)).not.toContain('source_name_8');

    expect(runButton).toBeDisabled();
    expect(within(panel).getByText('cost by deployment')).toBeInTheDocument();
    expect(within(panel).getByText('QueryBuilder.ProposedQueryAppliedNote')).toBeInTheDocument();
  });

  test('a follow-up reply without SQL does not disturb a previously loaded query', async () => {
    const user = userEvent.setup();
    setQueryAssistantEnabled(true);
    vi.mocked(translateSqlToQuery).mockResolvedValue({ success: false, status: 400 } as never);

    renderBuilder();
    const { panel, runButton } = await sendMessage(user, '```sql\nSELECT 1\n```');
    await user.click(runButton);
    await screen.findByRole('radio', { name: 'QueryBuilder.ViewSql', checked: true });

    vi.mocked(generateQuery).mockResolvedValue(assistantReply('Which project should I filter by?'));
    await ask(user, panel, 'more detail');

    expect(await within(panel).findByText('Which project should I filter by?')).toBeInTheDocument();
    expect(runButton).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'QueryBuilder.ViewSql' })).toBeChecked();
    expect(screen.getByLabelText('sql-editor')).toHaveValue(formatSql('SELECT 1'));
  });

  test('running an earlier message re-enables the other one and moves execution back to it', async () => {
    const user = userEvent.setup();
    setQueryAssistantEnabled(true);
    vi.mocked(translateSqlToQuery).mockResolvedValue({ success: false, status: 400 } as never);
    runSqlMock.mockResolvedValue({ isSuccess: true, result: { rows: [] } } as never);

    renderBuilder();
    const { panel, runButton: firstRun } = await sendMessage(user, '```sql\nSELECT 1\n```');
    await user.click(firstRun);
    await screen.findByRole('radio', { name: 'QueryBuilder.ViewSql', checked: true });

    vi.mocked(generateQuery).mockResolvedValue(assistantReply('```sql\nSELECT 2\n```'));
    await ask(user, panel, 'now by project');
    await waitFor(() => expect(messageRuns(panel)).toHaveLength(2));
    const runButtons = messageRuns(panel);
    expect(runButtons).toHaveLength(2);
    await waitFor(() => expect(runButtons[1]).toBeEnabled());

    await user.click(runButtons[1]);
    await waitFor(() => expect(firstRun).toBeEnabled());
    expect(within(panel).getAllByText('QueryBuilder.ProposedQueryAppliedNote')).toHaveLength(2);
    expect(runButtons[1]).toBeDisabled();
    expect(runSqlMock).toHaveBeenLastCalledWith('SELECT 2');

    await user.click(firstRun);
    await waitFor(() => expect(runButtons[1]).toBeEnabled());

    expect(firstRun).toBeDisabled();
    expect(runSqlMock).toHaveBeenLastCalledWith('SELECT 1');
    expect(screen.getByLabelText('sql-editor')).toHaveValue(formatSql('SELECT 1'));
  });

  test('collapsing and reopening the AI panel keeps the conversation and which message is loaded', async () => {
    const user = userEvent.setup();
    setQueryAssistantEnabled(true);
    vi.mocked(translateSqlToQuery).mockResolvedValue({ success: false, status: 400 } as never);
    runSqlMock.mockResolvedValue({ isSuccess: true, result: { rows: [] } } as never);

    renderBuilder();
    const { panel, runButton } = await sendMessage(user, '```sql\nSELECT 1\n```');
    await user.click(runButton);
    await screen.findByRole('radio', { name: 'QueryBuilder.ViewSql', checked: true });

    await user.click(within(panel).getByRole('button', { name: 'QueryBuilder.AiPanelCollapse' }));
    expect(await screen.findByRole('button', { name: 'QueryBuilder.AiPanelExpand' })).toBeInTheDocument();
    expect(screen.queryByText('cost by deployment')).toBeNull();

    const reopened = await openAiPanel(user);

    expect(within(reopened).getByText('cost by deployment')).toBeInTheDocument();
    expect(within(reopened).getByRole('button', { name: 'QueryBuilder.ProposedQueryApply' })).toBeDisabled();

    vi.mocked(generateQuery).mockResolvedValue(assistantReply('```sql\nSELECT 2\n```'));
    await ask(user, reopened, 'now by project');
    await waitFor(() => expect(messageRuns(reopened)).toHaveLength(2));

    await waitFor(() => expect(messageRuns(reopened)[1]).toBeEnabled());
    expect(messageRuns(reopened)[0]).toBeDisabled();
  });

  test('a send that fails in transit notifies and leaves the prompt usable', async () => {
    const user = userEvent.setup();
    setQueryAssistantEnabled(true);
    vi.mocked(generateQuery).mockRejectedValue(new Error('network'));

    renderBuilder();
    const panel = await openAiPanel(user);
    await ask(user, panel, 'cost by deployment');

    const prompt = within(panel).getByRole('textbox', { name: 'QueryBuilder.AskAi' });
    await waitFor(() => expect(prompt).toBeEnabled());
    expect(showNotificationMock).toHaveBeenCalled();
  });

  test('a message whose schema read fails in transit still runs as SQL in the SQL view', async () => {
    const user = userEvent.setup();
    setQueryAssistantEnabled(true);
    vi.mocked(translateSqlToQuery).mockResolvedValue({
      success: true,
      response: { query: rowQuery({ entity: 'feedback' }) },
    });
    vi.mocked(getEntitySchema).mockRejectedValue(new Error('network'));
    runSqlMock.mockResolvedValue({ isSuccess: true, result: { rows: [] } } as never);

    renderBuilder({ initialEntities: [{ name: 'dial_usage_log' }, { name: 'feedback' }] });
    const { runButton } = await sendMessage(user, '```sql\nSELECT 1\n```');
    await user.click(runButton);

    expect(await screen.findByRole('radio', { name: 'QueryBuilder.ViewSql', checked: true })).toBeInTheDocument();
    expect(runSqlMock).toHaveBeenCalledWith('SELECT 1');
    expect(runQueryMock).not.toHaveBeenCalled();
  });

  test('a translation that fails in transit still runs the message as SQL and leaves Run usable', async () => {
    const user = userEvent.setup();
    setQueryAssistantEnabled(true);
    vi.mocked(translateSqlToQuery).mockRejectedValue(new Error('network'));
    runSqlMock.mockResolvedValue({ isSuccess: true, result: { rows: [] } } as never);

    renderBuilder();
    const { panel, runButton } = await sendMessage(user, '```sql\nSELECT 1\n```');
    await user.click(runButton);

    expect(await screen.findByRole('radio', { name: 'QueryBuilder.ViewSql', checked: true })).toBeInTheDocument();
    expect(runSqlMock).toHaveBeenCalledWith('SELECT 1');

    vi.mocked(generateQuery).mockResolvedValue(assistantReply('```sql\nSELECT 2\n```'));
    await ask(user, panel, 'now by project');
    await waitFor(() => expect(messageRuns(panel)).toHaveLength(2));

    await waitFor(() => expect(messageRuns(panel)[1]).toBeEnabled());
  });

  test('going to the Builder after a message ran as raw SQL asks for confirmation', async () => {
    const user = userEvent.setup();
    setQueryAssistantEnabled(true);
    vi.mocked(translateSqlToQuery).mockResolvedValue({ success: false, status: 400 } as never);
    runSqlMock.mockResolvedValue({ isSuccess: true, result: { rows: [] } } as never);

    renderBuilder();
    const { panel, runButton } = await sendMessage(user, '```sql\nSELECT 1\n```');
    await user.click(runButton);
    await screen.findByRole('radio', { name: 'QueryBuilder.ViewSql', checked: true });
    const builderRadio = screen.getByRole('radio', { name: 'QueryBuilder.ViewForm' });
    await waitFor(() => expect(builderRadio).toBeEnabled());

    await user.click(builderRadio);

    expect(await screen.findByText('QueryBuilder.SwitchToBuilderHeader')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'QueryBuilder.StayInSql' }));

    expect(screen.getByRole('radio', { name: 'QueryBuilder.ViewSql' })).toBeChecked();
    expect(screen.getByLabelText('sql-editor')).toHaveValue(formatSql('SELECT 1'));
    expect(within(panel).getByText('cost by deployment')).toBeInTheDocument();
  });

  test('the view switcher is disabled while a message is loading', async () => {
    const user = userEvent.setup();
    setQueryAssistantEnabled(true);
    let resolveTranslation: (value: unknown) => void = () => undefined;
    vi.mocked(translateSqlToQuery).mockReturnValue(new Promise((resolve) => (resolveTranslation = resolve)) as never);
    runSqlMock.mockResolvedValue({ isSuccess: true, result: { rows: [] } } as never);

    renderBuilder();
    const { runButton } = await sendMessage(user, '```sql\nSELECT 1\n```');
    await user.click(runButton);

    const builderRadio = screen.getByRole('radio', { name: 'QueryBuilder.ViewForm' });
    expect(builderRadio).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'QueryBuilder.ViewSql' })).toBeDisabled();
    resolveTranslation({ success: false, status: 400 });
    await waitFor(() => expect(builderRadio).toBeEnabled());
  });

  test('SQL edited with the AI panel open and then taken to the Builder is translated first', async () => {
    const user = userEvent.setup();
    setQueryAssistantEnabled(true);
    vi.mocked(translateQuery).mockResolvedValue({ success: true, response: { sql: 'SELECT * FROM dial_usage_log' } });
    vi.mocked(translateSqlToQuery).mockResolvedValue({ success: false, status: 400 } as never);

    renderBuilder();
    await user.click(screen.getByRole('radio', { name: 'QueryBuilder.ViewSql' }));
    const editor = await screen.findByLabelText('sql-editor');
    await user.clear(editor);
    await user.click(editor);
    await user.paste('SELECT bad');
    await openAiPanel(user);
    await user.click(screen.getByRole('radio', { name: 'QueryBuilder.ViewForm' }));

    expect(await screen.findByText('QueryBuilder.SwitchToBuilderHeader')).toBeInTheDocument();
    expect(translateSqlToQuery).toHaveBeenCalledWith('SELECT bad');
  });
});

describe('QueryBuilder :: SQL view Run', () => {
  beforeEach(() => {
    vi.mocked(translateQuery).mockResolvedValue({ success: true, response: { sql: 'SELECT 1' } });
  });

  const AGG_ROWS = [
    { deployment: 'gpt-4o', total: 120 },
    { deployment: 'claude', total: 80 },
  ];

  const runSql = async (user: User, sql: string) => {
    await user.click(screen.getByRole('radio', { name: 'QueryBuilder.ViewSql' }));
    const editor = await screen.findByLabelText('sql-editor');
    await user.clear(editor);
    await user.click(editor);
    await user.paste(sql);
    await user.click(screen.getByRole('button', { name: /QueryBuilder.Run/ }));
  };

  test('translates and executes together, then charts the translated grouping', async () => {
    const user = userEvent.setup();
    runSqlMock.mockResolvedValue({ isSuccess: true, result: { rows: AGG_ROWS } } as never);
    vi.mocked(translateSqlToQuery).mockResolvedValue({
      success: true,
      response: {
        query: {
          entity: 'dial_usage_log',
          mode: QueryMode.Aggregate,
          group_by: ['deployment'],
          select: [{ expr: { type: QueryExprType.Field, name: 'deployment' } }],
        } as StructuredQuery,
      },
    } as never);

    renderBuilder();
    await runSql(user, 'SELECT deployment, count(*) AS total FROM dial_usage_log GROUP BY deployment');

    expect(runSqlMock).toHaveBeenCalled();
    expect(translateSqlToQuery).toHaveBeenCalled();

    await user.click(await screen.findByRole('radio', { name: 'QueryBuilder.ViewChart' }));
    expect(await screen.findByRole('combobox', { name: /^QueryBuilder.ChartXAxis/ })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /^QueryBuilder.ChartYAxis/ })).toBeInTheDocument();
  });

  test('a rejected translation still shows the result and raises no notification', async () => {
    const user = userEvent.setup();
    runSqlMock.mockResolvedValue({ isSuccess: true, result: { rows: AGG_ROWS } } as never);
    vi.mocked(translateSqlToQuery).mockResolvedValue({ success: false, status: 400 } as never);

    renderBuilder();
    await runSql(user, 'SELECT sum(a) / count(*) AS avg_a FROM dial_usage_log');

    expect(await screen.findByText('grid rows: 2')).toBeInTheDocument();
    expect(showNotificationMock).not.toHaveBeenCalled();
  });

  test('a rejected translation still charts, classifying columns from the rows', async () => {
    const user = userEvent.setup();
    runSqlMock.mockResolvedValue({ isSuccess: true, result: { rows: AGG_ROWS } } as never);
    vi.mocked(translateSqlToQuery).mockResolvedValue({ success: false, status: 400 } as never);

    renderBuilder();
    await runSql(user, 'SELECT sum(a) / count(*) AS avg_a FROM dial_usage_log');
    await screen.findByText('grid rows: 2');

    await user.click(screen.getByRole('radio', { name: 'QueryBuilder.ViewChart' }));
    expect(await screen.findByRole('combobox', { name: /^QueryBuilder.ChartXAxis/ })).toBeInTheDocument();
  });

  test('a translation that rejects outright still shows the result and clears the running state', async () => {
    const user = userEvent.setup();
    runSqlMock.mockResolvedValue({ isSuccess: true, result: { rows: AGG_ROWS } } as never);
    vi.mocked(translateSqlToQuery).mockRejectedValue(new Error('network down'));

    renderBuilder();
    await runSql(user, 'SELECT deployment FROM dial_usage_log');

    expect(await screen.findByText('grid rows: 2')).toBeInTheDocument();
    expect(showNotificationMock).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(screen.getByRole('button', { name: /QueryBuilder.Run/ })).toBeEnabled());
  });

  test('a failed run keeps its error notification', async () => {
    const user = userEvent.setup();
    runSqlMock.mockResolvedValue({ isSuccess: false, result: null, errorMessage: 'boom' } as never);
    vi.mocked(translateSqlToQuery).mockResolvedValue({ success: false, status: 400 } as never);

    renderBuilder();
    await runSql(user, 'SELECT bad');

    await vi.waitFor(() => expect(showNotificationMock).toHaveBeenCalled());
  });
});

describe('QueryBuilder — Export CSV', () => {
  const EXPORT = { name: 'QueryBuilder.ExportCsv' };
  const ROW_RESULT = { isSuccess: true, result: { columns: ['event_id'], rows: [{ event_id: '1' }] } };
  const csvOf = (records: number, totalCount?: number): CsvOutcome => ({
    isSuccess: true,
    file: {
      blob: new Blob([`id\r\n${'1\r\n'.repeat(records)}`]),
      fileName: 'result.csv',
      ...(totalCount != null && { totalCount }),
    },
  });

  const runSqlView = async (user: User, sql: string) => {
    await user.click(screen.getByRole('radio', { name: 'QueryBuilder.ViewSql' }));
    const editor = await screen.findByLabelText('sql-editor');
    fireEvent.change(editor, { target: { value: sql } });
    await user.click(screen.getByRole('button', { name: /QueryBuilder.Run/ }));
    await screen.findByRole('button', EXPORT);
  };

  beforeEach(() => {
    runQueryMock.mockResolvedValue(ROW_RESULT as never);
    runSqlMock.mockResolvedValue(ROW_RESULT as never);
    exportCsvMock.mockResolvedValue(csvOf(1));
    vi.mocked(translateQuery).mockResolvedValue({ success: true, response: { sql: '' } });
  });

  test('offers no export before a run', () => {
    renderBuilder();

    expect(screen.queryByRole('button', EXPORT)).toBeNull();
  });

  test('exports a structured run as the first 1000 rows of the same query', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('button', { name: /QueryBuilder.Run/ }));
    await user.click(await screen.findByRole('button', EXPORT));

    const ran = runQueryMock.mock.calls[0][0] as StructuredQuery;
    const exported = exportCsvMock.mock.calls[0][0] as { kind: QueryRequestKind; query: StructuredQuery };
    expect(exported.kind).toBe(QueryRequestKind.Structured);
    expect(exported.query).toEqual({
      ...ran,
      page: { type: QueryPageType.Offset, offset: 0, limit: 1000, include_total: expect.any(Boolean) },
    });
  });

  test('exports the statement that ran, not the one edited since', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await runSqlView(user, 'SELECT 1');

    fireEvent.change(screen.getByLabelText('sql-editor'), { target: { value: 'SELECT 2' } });
    await user.click(screen.getByRole('button', EXPORT));

    expect(exportCsvMock).toHaveBeenCalledWith({ kind: QueryRequestKind.Sql, sql: 'SELECT 1' });
  });

  test('keeps the export bound to the shown result after a failed run', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await runSqlView(user, 'SELECT 1');

    runSqlMock.mockResolvedValueOnce({ isSuccess: false, result: null, error: 'boom' });
    fireEvent.change(screen.getByLabelText('sql-editor'), { target: { value: 'SELECT 2' } });
    await user.click(screen.getByRole('button', { name: /QueryBuilder.Run/ }));
    await vi.waitFor(() => expect(showNotificationMock).toHaveBeenCalledOnce());
    await user.click(screen.getByRole('button', EXPORT));

    expect(exportCsvMock).toHaveBeenLastCalledWith({ kind: QueryRequestKind.Sql, sql: 'SELECT 1' });
  });

  test('shows the export as busy until the file arrives', async () => {
    const user = userEvent.setup();
    let finish: (outcome: CsvOutcome) => void = () => undefined;
    exportCsvMock.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    renderBuilder();
    await runSqlView(user, 'SELECT 1');

    await user.click(screen.getByRole('button', EXPORT));

    expect(screen.getByRole('button', EXPORT)).toHaveAttribute('aria-busy', 'true');
    finish(csvOf(1));
    await waitFor(() => expect(screen.getByRole('button', EXPORT)).toHaveAttribute('aria-busy', 'false'));
    expect(downloadFile).toHaveBeenCalledOnce();
  });

  test('downloads the file and shows no notice for a complete file', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await runSqlView(user, 'SELECT 1');

    await user.click(screen.getByRole('button', EXPORT));

    await vi.waitFor(() => expect(downloadFile).toHaveBeenCalledWith(expect.any(Blob), 'result.csv'));
    expect(showNotificationMock).not.toHaveBeenCalled();
  });

  test('tells the user a file at the maximum may be partial', async () => {
    const user = userEvent.setup();
    exportCsvMock.mockResolvedValue(csvOf(1000));
    renderBuilder();
    await runSqlView(user, 'SELECT 1');

    await user.click(screen.getByRole('button', EXPORT));

    await vi.waitFor(() =>
      expect(showNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'QueryBuilder.ExportCsvDone',
          description: 'QueryBuilder.ExportCsvPartialAtLimit',
        }),
      ),
    );
  });

  test('names the reported total when it exceeds the file', async () => {
    const user = userEvent.setup();
    exportCsvMock.mockResolvedValue(csvOf(1000, 4200));
    renderBuilder();
    await runSqlView(user, 'SELECT 1');

    await user.click(screen.getByRole('button', EXPORT));

    await vi.waitFor(() =>
      expect(showNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'QueryBuilder.ExportCsvPartialOfTotal' }),
      ),
    );
  });

  test('shows the service error and downloads nothing when the export fails', async () => {
    const user = userEvent.setup();
    exportCsvMock.mockResolvedValue({ isSuccess: false, file: null, errorHeader: 'bad_request', error: 'limit' });
    renderBuilder();
    await runSqlView(user, 'SELECT 1');

    await user.click(screen.getByRole('button', EXPORT));

    await vi.waitFor(() =>
      expect(showNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'QueryBuilder.ExportCsvFailed', description: 'limit' }),
      ),
    );
    expect(downloadFile).not.toHaveBeenCalled();
    expect(screen.getByText('grid rows: 1')).toBeTruthy();
  });
});
