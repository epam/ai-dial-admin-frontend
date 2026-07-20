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
const generateButton = () => screen.getByRole('button', { name: 'QueryBuilder.AiGenerate' });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AiPanel', () => {
  test('renders the heading, prompt, suggestions, and a disabled Generate button', () => {
    render(<AiPanel onGenerated={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'QueryBuilder.AiPanelHeading' })).toBeInTheDocument();
    expect(promptBox()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'QueryBuilder.AiSuggestionCost' })).toBeInTheDocument();
    expect(generateButton()).toBeDisabled();
  });

  test('clicking a suggestion fills the prompt and enables Generate', async () => {
    const user = userEvent.setup();
    render(<AiPanel onGenerated={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'QueryBuilder.AiSuggestionCost' }));

    expect(promptBox()).toHaveValue('QueryBuilder.AiSuggestionCost');
    expect(generateButton()).toBeEnabled();
  });

  test('a successful generation shows the SQL and hands it up automatically (no Apply step)', async () => {
    const user = userEvent.setup();
    const onGenerated = vi.fn();
    vi.mocked(generateQuery).mockResolvedValue(reply('Here you go:\n```sql\nSELECT 1\n```') as never);

    render(<AiPanel onGenerated={onGenerated} />);
    await user.type(promptBox(), 'cost by deployment');
    await user.click(generateButton());

    expect(await screen.findByText('SELECT 1')).toBeInTheDocument();
    expect(screen.getByText('QueryBuilder.AiRunHint')).toBeInTheDocument();
    expect(onGenerated).toHaveBeenCalledWith('SELECT 1');
    expect(generateQuery).toHaveBeenCalledWith([{ role: 'user', content: 'cost by deployment' }]);
  });

  test('a reply without SQL shows the response text and is not loaded', async () => {
    const user = userEvent.setup();
    const onGenerated = vi.fn();
    vi.mocked(generateQuery).mockResolvedValue(reply('I need more detail — which project?') as never);

    render(<AiPanel onGenerated={onGenerated} />);
    await user.type(promptBox(), 'something vague');
    await user.click(generateButton());

    expect(await screen.findByText('QueryBuilder.AiResponseLabel')).toBeInTheDocument();
    expect(onGenerated).toHaveBeenCalledWith(null);
  });

  test('a failed generation surfaces a notification and loads nothing', async () => {
    const user = userEvent.setup();
    const onGenerated = vi.fn();
    vi.mocked(generateQuery).mockResolvedValue({ success: false, status: 500 } as never);

    render(<AiPanel onGenerated={onGenerated} />);
    await user.type(promptBox(), 'cost');
    await user.click(generateButton());

    await waitFor(() => expect(showNotification).toHaveBeenCalled());
    expect(onGenerated).not.toHaveBeenCalled();
  });
});
