import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import AiPanel from '@/src/components/Analytics/QueryBuilder/Ai/AiPanel';
import { QueryBuilderContext } from '@/src/components/Analytics/QueryBuilder/context';
import { createInitialState } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { TEST_FUNCTIONS } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryBuilderState } from '@/src/models/analytics/query-builder';
import { QueryAssistantMessage, QueryAssistantRole } from '@/src/models/analytics/query-assistant';
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

const promptBox = () => screen.getByRole('textbox', { name: 'QueryBuilder.AiPanelHeading' });
const sendButton = () => screen.getByRole('button', { name: 'QueryBuilder.AiSend' });

const FIELDS: AnalyticsEntityField[] = [
  { name: 'request_time', type: AnalyticsFieldType.Timestamp, source: 'request_time' },
  { name: 'project_id', type: AnalyticsFieldType.String, source: 'project_id', display_name: 'Project' },
];

// The panel reads the selected source from the builder context, the same place the other sections do.
const builderState = (overrides?: Partial<QueryBuilderState>): QueryBuilderState => ({
  ...createInitialState(TEST_FUNCTIONS),
  entityName: 'dial_usage_log',
  fields: FIELDS,
  ...overrides,
});

const renderPanel = (
  overrides: Partial<Parameters<typeof AiPanel>[0]> = {},
  state: QueryBuilderState = builderState(),
) => {
  const props = { onRunMessage: vi.fn(), loadedMessageIndex: null, runInFlight: false, ...overrides };
  render(
    <QueryBuilderContext.Provider value={{ state, refresh: vi.fn(), patch: vi.fn() }}>
      <AiPanel {...props} />
    </QueryBuilderContext.Provider>,
  );
  return props;
};

const sentMessages = () => vi.mocked(generateQuery).mock.calls[0][0] as QueryAssistantMessage[];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AiPanel', () => {
  test('renders the heading, prompt, suggestions, and a disabled Send button', () => {
    renderPanel();

    expect(screen.getByRole('heading', { name: 'QueryBuilder.AiPanelHeading' })).toBeInTheDocument();
    expect(promptBox()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'QueryBuilder.AiSuggestionCost' })).toBeInTheDocument();
    expect(sendButton()).toBeDisabled();
  });

  test('clicking a suggestion fills the prompt and enables Send', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'QueryBuilder.AiSuggestionCost' }));

    expect(promptBox()).toHaveValue('QueryBuilder.AiSuggestionCost');
    expect(sendButton()).toBeEnabled();
  });

  test('sending appends the user message immediately and the reply with SQL gets an inline Run/Copy', async () => {
    const user = userEvent.setup();
    vi.mocked(generateQuery).mockResolvedValue(reply('Here you go:\n```sql\nSELECT 1\n```') as never);
    const { onRunMessage } = renderPanel();

    await user.type(promptBox(), 'cost by deployment');
    await user.click(sendButton());

    expect(screen.getByText('cost by deployment')).toBeInTheDocument();
    expect(promptBox()).toHaveValue('');
    expect(await screen.findByText('SELECT 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'QueryBuilder.Run' }));
    expect(onRunMessage).toHaveBeenCalledWith('SELECT 1', 1);
    // The request leads with a schema message the transcript never shows, followed by the turns.
    expect(sentMessages()[sentMessages().length - 1]).toEqual({ role: 'user', content: 'cost by deployment' });
  });

  test('sending a message scrolls the new user message into view', async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');
    vi.mocked(generateQuery).mockResolvedValue(reply('```sql\nSELECT 1\n```') as never);
    renderPanel();

    await user.type(promptBox(), 'cost by deployment');
    await user.click(sendButton());

    await screen.findByText('SELECT 1');
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  test('suggestions are hidden once a message has been sent', async () => {
    const user = userEvent.setup();
    vi.mocked(generateQuery).mockResolvedValue(reply('Sure, one moment.') as never);
    renderPanel();

    await user.type(promptBox(), 'cost by deployment');
    await user.click(sendButton());

    await screen.findByText('Sure, one moment.');
    expect(screen.queryByRole('button', { name: 'QueryBuilder.AiSuggestionCost' })).not.toBeInTheDocument();
  });

  test('a reply without SQL renders as a plain message with no Run or Copy action', async () => {
    const user = userEvent.setup();
    const { onRunMessage } = renderPanel();
    vi.mocked(generateQuery).mockResolvedValue(reply('I need more detail — which project?') as never);

    await user.type(promptBox(), 'something vague');
    await user.click(sendButton());

    expect(await screen.findByText('I need more detail — which project?')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'QueryBuilder.Run' })).not.toBeInTheDocument();
    expect(onRunMessage).not.toHaveBeenCalled();
  });

  test('a failed send surfaces a notification and keeps the user message in the transcript', async () => {
    const user = userEvent.setup();
    renderPanel();
    vi.mocked(generateQuery).mockResolvedValue({ success: false, status: 500 } as never);

    await user.type(promptBox(), 'cost');
    await user.click(sendButton());

    await waitFor(() => expect(showNotification).toHaveBeenCalled());
    expect(screen.getByText('cost')).toBeInTheDocument();
  });

  test('inline Run is disabled for the currently loaded message, and while a run is in flight', async () => {
    const user = userEvent.setup();
    vi.mocked(generateQuery).mockResolvedValue(reply('```sql\nSELECT 1\n```') as never);
    renderPanel({ loadedMessageIndex: 1, runInFlight: false });

    await user.type(promptBox(), 'cost by deployment');
    await user.click(sendButton());

    await screen.findByText('SELECT 1');
    expect(screen.getByRole('button', { name: 'QueryBuilder.Run' })).toBeDisabled();
  });

  test('inline Run is disabled while a run is in flight even for a not-yet-loaded message', async () => {
    const user = userEvent.setup();
    vi.mocked(generateQuery).mockResolvedValue(reply('```sql\nSELECT 1\n```') as never);
    renderPanel({ loadedMessageIndex: null, runInFlight: true });

    await user.type(promptBox(), 'cost by deployment');
    await user.click(sendButton());

    await screen.findByText('SELECT 1');
    expect(screen.getByRole('button', { name: 'QueryBuilder.Run' })).toBeDisabled();
  });

  test('leads the request with the selected source and its columns', async () => {
    const user = userEvent.setup();
    vi.mocked(generateQuery).mockResolvedValue(reply('ok') as never);
    renderPanel();

    await user.type(promptBox(), 'cost by project');
    await user.click(sendButton());

    await waitFor(() => expect(generateQuery).toHaveBeenCalledOnce());
    const [first] = sentMessages();
    expect(first.role).toBe(QueryAssistantRole.System);
    expect(first.content).toContain('dial_usage_log');
    expect(first.content).toContain('request_time (timestamp)');
    expect(first.content).toContain('project_id (string)');
    expect(first.content).toContain('Project');
  });

  test('keeps the schema message out of the visible transcript', async () => {
    const user = userEvent.setup();
    vi.mocked(generateQuery).mockResolvedValue(reply('ok') as never);
    renderPanel();

    await user.type(promptBox(), 'cost by project');
    await user.click(sendButton());

    await waitFor(() => expect(generateQuery).toHaveBeenCalledOnce());
    expect(screen.queryByText(/Columns of/)).toBeNull();
  });

  test('describes the source selected at send time, not the one selected first', async () => {
    const user = userEvent.setup();
    vi.mocked(generateQuery).mockResolvedValue(reply('ok') as never);
    renderPanel({}, builderState({ entityName: 'other_table', fields: [] }));

    await user.type(promptBox(), 'anything');
    await user.click(sendButton());

    await waitFor(() => expect(generateQuery).toHaveBeenCalledOnce());
    const [first] = sentMessages();
    expect(first.content).toContain('other_table');
    expect(first.content).toContain('column list is unavailable');
  });
});
