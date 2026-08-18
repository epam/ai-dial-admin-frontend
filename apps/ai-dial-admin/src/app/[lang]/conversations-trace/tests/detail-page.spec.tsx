import { beforeEach, describe, expect, test, vi } from 'vitest';

import Page from '@/src/app/[lang]/conversations-trace/[id]/page';
import {
  getConversationDetail,
  getConversationFeedback,
  getConversationTurns,
} from '@/src/app/[lang]/conversations-trace/actions';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';

vi.mock('@/src/app/[lang]/conversations-trace/actions');
vi.mock('@/src/server/analytics/analytics-access');
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn(), errorLog: vi.fn() }));

const notFoundError = new Error('NEXT_NOT_FOUND');
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw notFoundError;
  },
}));

const CHAT_ID = 'Lrr0e6L5bpTND3IY_dN0_';

const DETAIL_ROW = {
  chat_id: CHAT_ID,
  project_id: '',
  user_hash: 'db73',
  turn_count: 1,
  first_request_time: '2026-07-22T11:50:28.506Z',
  last_request_time: '2026-07-22T12:00:52.157Z',
  prompt_tokens: 1,
  completion_tokens: 2,
  total_tokens: 3,
  total_price: '0.1',
  success_count: 1,
  duration_ms: 0,
  avg_duration_ms: 0,
};

const forbidden = () => isAnalyticsForbidden as unknown as ReturnType<typeof vi.fn>;
const detail = () => getConversationDetail as unknown as ReturnType<typeof vi.fn>;
const feedback = () => getConversationFeedback as unknown as ReturnType<typeof vi.fn>;
const turns = () => getConversationTurns as unknown as ReturnType<typeof vi.fn>;

const TURN = { trace_id: 't1', started: 1, hops: 3, tokens: 1, cost: '0.1' };

const render = (id: string) => Page({ params: Promise.resolve({ id }) });

const componentName = (node: Awaited<ReturnType<typeof render>>): string => {
  const type = (node as unknown as { type: { name?: string } }).type;
  return type?.name ?? '';
};

beforeEach(() => {
  vi.clearAllMocks();
  forbidden().mockResolvedValue(false);
  detail().mockResolvedValue({ success: true, response: { conversation: DETAIL_ROW } });
  feedback().mockResolvedValue({ success: true, response: { rows: [], total: 0 } });
  turns().mockResolvedValue({ success: true, response: { turns: [TURN] } });
});

describe('conversation detail route', () => {
  test('renders the forbidden view when analytics access is denied', async () => {
    forbidden().mockResolvedValue(true);

    expect(componentName(await render(CHAT_ID))).toBe('Page403');
    expect(detail()).not.toHaveBeenCalled();
  });

  test('renders the detail view for an existing conversation', async () => {
    expect(componentName(await render(CHAT_ID))).toBe('ConversationDetailView');
  });

  // The action reports a failed query inside its response, so `if (!row) notFound()` would turn every
  // backend outage into "this conversation does not exist".
  test('a failed query renders the error state rather than not-found', async () => {
    detail().mockResolvedValue({ success: false, errorMessage: 'boom' });

    expect(componentName(await render(CHAT_ID))).toBe('ConversationDetailError');
  });

  test('a successful query with no conversation calls notFound', async () => {
    detail().mockResolvedValue({ success: true, response: { conversation: null } });

    await expect(render(CHAT_ID)).rejects.toBe(notFoundError);
  });

  // The request layer lets a connection refusal reject rather than reporting it in the payload, so the
  // route must survive a thrown error, not only a `success: false` one.
  test('a thrown query error renders the error state, not a crash', async () => {
    detail().mockRejectedValue(new TypeError('fetch failed'));

    expect(componentName(await render(CHAT_ID))).toBe('ConversationDetailError');
  });

  test('a failed feedback query still renders the conversation', async () => {
    feedback().mockResolvedValue({ success: false, errorMessage: 'boom' });

    expect(componentName(await render(CHAT_ID))).toBe('ConversationDetailView');
  });

  test('decodes an id containing a path separator', async () => {
    const raw = 'conversations%2FeRxsos%2Fchathub-claude4';

    await render(raw);

    expect(detail()).toHaveBeenCalledWith('conversations/eRxsos/chathub-claude4');
  });

  test('decodes an id carrying percent-encoded query text', async () => {
    const raw = 'chat%2Fen%2Fgive%2520me%2520gdp-1786535692111';

    await render(raw);

    expect(detail()).toHaveBeenCalledWith('chat/en/give%20me%20gdp-1786535692111');
  });

  test('requests the conversation and its feedback for the same id', async () => {
    await render(CHAT_ID);

    expect(detail()).toHaveBeenCalledWith(CHAT_ID);
    expect(feedback()).toHaveBeenCalledWith(CHAT_ID);
  });

  test('a conversation with no turns still renders', async () => {
    turns().mockResolvedValue({ success: true, response: { turns: [] } });

    expect(componentName(await render(CHAT_ID))).toBe('ConversationDetailView');
  });
});
