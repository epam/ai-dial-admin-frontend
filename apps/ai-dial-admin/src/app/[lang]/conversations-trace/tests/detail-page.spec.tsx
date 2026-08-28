import { beforeEach, describe, expect, test, vi } from 'vitest';

import Page from '@/src/app/[lang]/conversations-trace/[id]/page';
import {
  getConversationDetail,
  getConversationFeedback,
  getConversationTranscriptAvailability,
  getConversationsSchema,
} from '@/src/app/[lang]/conversations-trace/actions';
import { ConversationsField } from '@/src/models/analytics/conversations-trace';
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
  client_session_id: CHAT_ID,
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
  deployments: ['anthropic.claude-opus-4-8'],
  traces: ['0a3f1d9c8b7e6a5f'],
  'session_insights.title': 'Refund policy for EU orders',
};

const forbidden = () => isAnalyticsForbidden as unknown as ReturnType<typeof vi.fn>;
const detail = () => getConversationDetail as unknown as ReturnType<typeof vi.fn>;
const feedback = () => getConversationFeedback as unknown as ReturnType<typeof vi.fn>;
const schema = () => getConversationsSchema as unknown as ReturnType<typeof vi.fn>;
const availability = () => getConversationTranscriptAvailability as unknown as ReturnType<typeof vi.fn>;

const SCHEMA_FIELDS = Object.keys(DETAIL_ROW).map((name) => ({ name, type: 'string', source: 'sessions' }));

const render = (id: string) => Page({ params: Promise.resolve({ id }) });

const componentName = (node: Awaited<ReturnType<typeof render>>): string => {
  const type = (node as unknown as { type: { name?: string } }).type;
  return type?.name ?? '';
};

const isReadableOfNode = (node: Awaited<ReturnType<typeof render>>): boolean =>
  (node as unknown as { props: { isTranscriptReadable: boolean } }).props.isTranscriptReadable;

beforeEach(() => {
  vi.clearAllMocks();
  forbidden().mockResolvedValue(false);
  detail().mockResolvedValue({ success: true, response: { conversation: DETAIL_ROW } });
  feedback().mockResolvedValue({ success: true, response: { rows: [], total: 0 } });
  schema().mockResolvedValue({ success: true, response: { fields: SCHEMA_FIELDS } });
  availability().mockResolvedValue({ success: true, response: { isReadable: true } });
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

    expect(detail()).toHaveBeenCalledWith('conversations/eRxsos/chathub-claude4', expect.anything());
  });

  test('decodes an id carrying percent-encoded query text', async () => {
    const raw = 'chat%2Fen%2Fgive%2520me%2520gdp-1786535692111';

    await render(raw);

    expect(detail()).toHaveBeenCalledWith('chat/en/give%20me%20gdp-1786535692111', expect.anything());
  });

  test('requests the conversation and its feedback for the same id', async () => {
    await render(CHAT_ID);

    expect(detail()).toHaveBeenCalledWith(CHAT_ID, expect.arrayContaining([ConversationsField.ChatId]));
    expect(feedback()).toHaveBeenCalledWith(CHAT_ID);
  });

  test('builds the detail query from the fields the schema reports', async () => {
    schema().mockResolvedValue({ success: true, response: { fields: [{ name: ConversationsField.ChatId }] } });

    await render(CHAT_ID);

    expect(detail()).toHaveBeenCalledWith(CHAT_ID, [ConversationsField.ChatId]);
  });

  test('renders the conversation when the schema cannot be read', async () => {
    schema().mockResolvedValue({ success: false });

    expect(componentName(await render(CHAT_ID))).toBe('ConversationDetailView');
    expect(detail()).toHaveBeenCalledWith(CHAT_ID, undefined);
  });

  // The request layer rethrows a connection failure rather than reporting it in the payload, so a rejected
  // schema read would reject the whole wave and error a conversation the required-only projection resolves.
  test('renders the conversation when the schema read rejects', async () => {
    schema().mockRejectedValue(new TypeError('fetch failed'));

    expect(componentName(await render(CHAT_ID))).toBe('ConversationDetailView');
    expect(detail()).toHaveBeenCalledWith(CHAT_ID, undefined);
  });

  // Only the conversation query depends on the schema. Queueing the feedback and turn reads behind it would
  // add a round trip to every detail view for nothing.
  test('issues the feedback and turn reads without waiting for the schema', async () => {
    let releaseSchema: (value: unknown) => void = () => undefined;
    schema().mockReturnValue(
      new Promise((resolve) => {
        releaseSchema = resolve;
      }),
    );

    const pending = render(CHAT_ID);
    // The route awaits the access check and the route params before the read wave, so a single microtask
    // is not enough to reach it.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(feedback()).toHaveBeenCalledWith(CHAT_ID);
    expect(detail()).not.toHaveBeenCalled();

    releaseSchema({ success: true, response: { fields: SCHEMA_FIELDS } });
    await pending;

    expect(detail()).toHaveBeenCalledOnce();
  });

  // The transcript is one region of the page. A conversation whose header, panels, figures and trace all
  // resolved must still render when only its messages failed — and that region has to say the read failed
  // rather than that the conversation recorded nothing.
  test('a failed availability probe renders the conversation with Chat gated off', async () => {
    availability().mockResolvedValue({ success: false, response: { isReadable: false } });
    const node = await render(CHAT_ID);

    expect(componentName(node)).toBe('ConversationDetailView');
    expect(isReadableOfNode(node)).toBe(false);
  });

  test('a rejected availability probe renders the conversation with Chat gated off', async () => {
    availability().mockRejectedValue(new Error('hop log unavailable'));
    const node = await render(CHAT_ID);

    expect(componentName(node)).toBe('ConversationDetailView');
    expect(isReadableOfNode(node)).toBe(false);
  });

  // The retention split needs the conversation's own last activity, so the read cannot be issued before the
  // detail query resolves.
  // The body read moved behind the view switch, so the page issues only the cached schema probe — a
  // body-read failure is the Chat view's to state, not the page's.
  test('issues the availability probe and no transcript body read', async () => {
    await render(CHAT_ID);

    expect(availability()).toHaveBeenCalled();
  });
});
