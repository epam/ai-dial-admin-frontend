import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import AiPanel from '@/src/components/Analytics/QueryBuilder/Ai/AiPanel';
import { ProposedQueryStatus } from '@/src/components/Analytics/QueryBuilder/Ai/models';
import { useAiConversation } from '@/src/components/Analytics/QueryBuilder/Ai/use-ai-conversation';
import { QueryBuilderContext } from '@/src/components/Analytics/QueryBuilder/context';
import { createInitialState } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { TEST_FUNCTIONS } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryBuilderState } from '@/src/models/analytics/query-builder';
import { QueryAssistantRole } from '@/src/models/analytics/query-assistant';
import { generateQuery } from '@/src/app/[lang]/queries/actions';

vi.mock('@/src/app/[lang]/queries/actions');

const showNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification }),
}));

const reply = (content: string) => ({
  success: true,
  response: { choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content } }] },
});

const promptBox = () => screen.getByRole('textbox', { name: 'QueryBuilder.AskAi' });
const sendButton = () => screen.getByRole('button', { name: 'QueryBuilder.AiSend' });

const FIELDS: AnalyticsEntityField[] = [
  { name: 'request_time', type: AnalyticsFieldType.Timestamp, source: 'request_time' },
  { name: 'project_id', type: AnalyticsFieldType.String, source: 'project_id', display_name: 'Project' },
];

// The panel reads nothing from the builder context any more; a state is still provided so a test can
// prove the request ignores whichever source is selected.
const builderState = (overrides?: Partial<QueryBuilderState>): QueryBuilderState => ({
  ...createInitialState(TEST_FUNCTIONS),
  entityName: 'dial_usage_log',
  fields: FIELDS,
  ...overrides,
});

type PanelProps = Omit<Parameters<typeof AiPanel>[0], 'conversation'>;

// The conversation lives in the page; the harness plays that part so the panel is tested as mounted.
const PanelWithConversation = (props: PanelProps) => <AiPanel conversation={useAiConversation()} {...props} />;

const renderPanel = (overrides: Partial<PanelProps> = {}, state: QueryBuilderState = builderState()) => {
  const props = {
    onRunMessage: vi.fn(),
    loadedMessageIndex: null,
    messageStatuses: {},
    onDismissMessage: vi.fn(),
    runInFlight: false,
    ...overrides,
  };
  render(
    <QueryBuilderContext.Provider value={{ state, refresh: vi.fn(), patch: vi.fn() }}>
      <PanelWithConversation {...props} />
    </QueryBuilderContext.Provider>,
  );
  return props;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AiPanel', () => {
  test('renders the empty state, the prompt, and a disabled Send button', () => {
    renderPanel();

    expect(screen.getByText('QueryBuilder.AiEmptyTitle')).toBeTruthy();
    expect(promptBox()).toBeInTheDocument();
    expect(sendButton()).toBeDisabled();
  });

  test('sending appends the user message and a reply with SQL offers Dismiss and Apply and Run', async () => {
    const user = userEvent.setup();
    vi.mocked(generateQuery).mockResolvedValue(reply('Here you go:\n```sql\nSELECT 1\n```') as never);
    const { onRunMessage } = renderPanel();

    await user.type(promptBox(), 'cost by deployment');
    await user.click(sendButton());

    expect(screen.getByText('cost by deployment')).toBeInTheDocument();
    expect(promptBox()).toHaveValue('');
    expect(await screen.findByRole('button', { name: 'QueryBuilder.ProposedQueryApply' })).toBeTruthy();
    expect(screen.getByText('Here you go:')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'QueryBuilder.ProposedQueryDismiss' })).toBeTruthy();
    expect(screen.queryByText('SELECT 1')).toBeNull();
    expect(screen.queryByText('QueryBuilder.AiEmptyTitle')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'QueryBuilder.ProposedQueryApply' }));
    expect(onRunMessage).toHaveBeenCalledWith('SELECT 1', 1);
  });

  test('runs the proposed SQL exactly as the assistant wrote it', async () => {
    const user = userEvent.setup();
    const sql = 'SELECT model, count(*) AS n FROM dial_usage_log GROUP BY model';
    vi.mocked(generateQuery).mockResolvedValue(reply(`\`\`\`sql\n${sql}\n\`\`\``) as never);
    const { onRunMessage } = renderPanel();

    await user.type(promptBox(), 'count by model');
    await user.click(sendButton());

    await user.click(await screen.findByRole('button', { name: 'QueryBuilder.ProposedQueryApply' }));
    expect(onRunMessage).toHaveBeenCalledWith(sql, 1);
  });

  test('an applied proposed query keeps Apply and Run, drops Dismiss and says it was applied', async () => {
    const user = userEvent.setup();
    vi.mocked(generateQuery).mockResolvedValue(reply('```sql\nSELECT 1\n```') as never);
    renderPanel({ messageStatuses: { 1: ProposedQueryStatus.Applied } });

    await user.type(promptBox(), 'cost by deployment');
    await user.click(sendButton());

    expect(await screen.findByText('QueryBuilder.ProposedQueryAppliedNote')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'QueryBuilder.ProposedQueryApply' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'QueryBuilder.ProposedQueryDismiss' })).toBeNull();
  });

  test('Dismiss reports the message, and a dismissed proposed query offers no actions', async () => {
    const user = userEvent.setup();
    vi.mocked(generateQuery).mockResolvedValue(reply('```sql\nSELECT 1\n```') as never);
    const { onDismissMessage } = renderPanel();

    await user.type(promptBox(), 'cost by deployment');
    await user.click(sendButton());
    await user.click(await screen.findByRole('button', { name: 'QueryBuilder.ProposedQueryDismiss' }));

    expect(onDismissMessage).toHaveBeenCalledWith(1);
  });

  test('a dismissed proposed query shows its badge and note instead of the actions', async () => {
    const user = userEvent.setup();
    vi.mocked(generateQuery).mockResolvedValue(reply('```sql\nSELECT 1\n```') as never);
    renderPanel({ messageStatuses: { 1: ProposedQueryStatus.Dismissed } });

    await user.type(promptBox(), 'cost by deployment');
    await user.click(sendButton());

    expect(await screen.findByText('QueryBuilder.ProposedQueryDismissedNote')).toBeTruthy();
    expect(screen.getByText('QueryBuilder.ProposedQueryDismissed')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'QueryBuilder.ProposedQueryApply' })).toBeNull();
  });

  test('Enter sends the prompt and Shift+Enter does not', async () => {
    const user = userEvent.setup();
    vi.mocked(generateQuery).mockResolvedValue(reply('ok') as never);
    renderPanel();

    await user.type(promptBox(), 'cost{Shift>}{Enter}{/Shift}');
    expect(generateQuery).not.toHaveBeenCalled();

    await user.type(promptBox(), 'by project{Enter}');

    expect(await screen.findByText('ok')).toBeTruthy();
    expect(generateQuery).toHaveBeenCalledWith([{ role: QueryAssistantRole.User, content: 'cost\nby project' }]);
  });

  test('sending a message scrolls the new user message into view', async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');
    vi.mocked(generateQuery).mockResolvedValue(reply('```sql\nSELECT 1\n```') as never);
    renderPanel();

    await user.type(promptBox(), 'cost by deployment');
    await user.click(sendButton());

    await screen.findByRole('button', { name: 'QueryBuilder.ProposedQueryApply' });
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  test('a reply without SQL renders as a plain message with no Apply and Run action', async () => {
    const user = userEvent.setup();
    const { onRunMessage } = renderPanel();
    vi.mocked(generateQuery).mockResolvedValue(reply('I need more detail — which project?') as never);

    await user.type(promptBox(), 'something vague');
    await user.click(sendButton());

    expect(await screen.findByText('I need more detail — which project?')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'QueryBuilder.ProposedQueryApply' })).not.toBeInTheDocument();
    expect(onRunMessage).not.toHaveBeenCalled();
  });

  test('renders the assistant reply as markdown', async () => {
    const user = userEvent.setup();
    vi.mocked(generateQuery).mockResolvedValue(
      reply('I made 2 changes:\n\n- **Added** a filter on `model`\n- Removed the sort') as never,
    );
    renderPanel();

    await user.type(promptBox(), 'filter by model');
    await user.click(sendButton());

    const list = await screen.findByRole('list');
    expect(list.querySelectorAll('li')).toHaveLength(2);
    expect(screen.getByText('Added').tagName).toBe('STRONG');
    expect(screen.getByText('model').tagName).toBe('CODE');
    expect(screen.queryByText(/\*\*/)).toBeNull();
  });

  test('a failed send surfaces a notification and keeps the user message in the transcript', async () => {
    const user = userEvent.setup();
    renderPanel();
    vi.mocked(generateQuery).mockResolvedValue({ success: false, status: 500 } as never);

    await user.type(promptBox(), 'cost');
    await user.click(sendButton());

    expect(await screen.findByText('cost')).toBeInTheDocument();
    await vi.waitFor(() => expect(showNotification).toHaveBeenCalled());
  });

  test('inline Run is disabled for the currently loaded message, and while a run is in flight', async () => {
    const user = userEvent.setup();
    vi.mocked(generateQuery).mockResolvedValue(reply('```sql\nSELECT 1\n```') as never);
    renderPanel({ loadedMessageIndex: 1, runInFlight: false });

    await user.type(promptBox(), 'cost by deployment');
    await user.click(sendButton());

    await screen.findByRole('button', { name: 'QueryBuilder.ProposedQueryApply' });
    expect(screen.getByRole('button', { name: 'QueryBuilder.ProposedQueryApply' })).toBeDisabled();
  });

  test('inline Run is disabled while a run is in flight even for a not-yet-loaded message', async () => {
    const user = userEvent.setup();
    vi.mocked(generateQuery).mockResolvedValue(reply('```sql\nSELECT 1\n```') as never);
    renderPanel({ loadedMessageIndex: null, runInFlight: true });

    await user.type(promptBox(), 'cost by deployment');
    await user.click(sendButton());

    await screen.findByRole('button', { name: 'QueryBuilder.ProposedQueryApply' });
    expect(screen.getByRole('button', { name: 'QueryBuilder.ProposedQueryApply' })).toBeDisabled();
  });

  test('sends the visible transcript and nothing else', async () => {
    const user = userEvent.setup();
    vi.mocked(generateQuery).mockResolvedValue(reply('ok') as never);
    renderPanel();

    await user.type(promptBox(), 'cost by project');
    await user.click(sendButton());

    await vi.waitFor(() => expect(generateQuery).toHaveBeenCalledOnce());
    expect(generateQuery).toHaveBeenCalledWith([{ role: QueryAssistantRole.User, content: 'cost by project' }]);
  });

  test('sends both earlier turns along with the new request on a second send', async () => {
    const user = userEvent.setup();
    vi.mocked(generateQuery).mockResolvedValue(reply('first answer') as never);
    renderPanel();

    await user.type(promptBox(), 'cost by project');
    await user.click(sendButton());
    await screen.findByText('first answer');

    await user.type(promptBox(), 'now group by day');
    await user.click(sendButton());

    await vi.waitFor(() => expect(generateQuery).toHaveBeenCalledTimes(2));
    expect(generateQuery).toHaveBeenLastCalledWith([
      { role: QueryAssistantRole.User, content: 'cost by project' },
      { role: QueryAssistantRole.Assistant, content: 'first answer' },
      { role: QueryAssistantRole.User, content: 'now group by day' },
    ]);
  });

  test('sends the same request whichever source the toolbar has selected', async () => {
    const user = userEvent.setup();
    vi.mocked(generateQuery).mockResolvedValue(reply('ok') as never);
    renderPanel({}, builderState({ entityName: 'other_table', fields: [] }));

    await user.type(promptBox(), 'anything');
    await user.click(sendButton());

    await vi.waitFor(() => expect(generateQuery).toHaveBeenCalledOnce());
    expect(generateQuery).toHaveBeenCalledWith([{ role: QueryAssistantRole.User, content: 'anything' }]);
  });
});
