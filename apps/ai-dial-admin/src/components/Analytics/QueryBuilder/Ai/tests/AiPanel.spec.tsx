import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import AiPanel from '@/src/components/Analytics/QueryBuilder/Ai/AiPanel';
import { generateQuery } from '@/src/app/[lang]/query-builder/actions';

vi.mock('@/src/app/[lang]/query-builder/actions');

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

const renderPanel = (overrides: Partial<Parameters<typeof AiPanel>[0]> = {}) => {
  const props = { onRunMessage: vi.fn(), loadedMessageIndex: null, runInFlight: false, ...overrides };
  render(<AiPanel {...props} />);
  return props;
};

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
    expect(generateQuery).toHaveBeenCalledWith([{ role: 'user', content: 'cost by deployment' }]);
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
});
