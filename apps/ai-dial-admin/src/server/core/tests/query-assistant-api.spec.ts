import { QueryAssistantRole } from '@/src/models/analytics/query-assistant';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { QueryAssistantApi } from '../query-assistant-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

const JSON_HEADERS = { headers: { 'content-type': 'application/json' } };

describe('Server :: QueryAssistantApi', () => {
  const instance = new QueryAssistantApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('chatCompletion posts to the URL-encoded deployment chat-completions endpoint', async () => {
    const body = {
      choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content: '```sql\nSELECT 1\n```' } }],
    };
    fetch.mockResponseOnce(JSON.stringify(body), JSON_HEADERS);

    const res = await instance.chatCompletion(
      [{ role: QueryAssistantRole.User, content: 'hi' }],
      'applications/public/query-helper__0.0.1',
      TOKEN_MOCK,
    );

    expect(res.success).toBe(true);
    expect(res.response).toEqual(body);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/openai/deployments/applications%2Fpublic%2Fquery-helper__0.0.1/chat/completions'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('sends the messages array with stream:false', async () => {
    fetch.mockResponseOnce(JSON.stringify({ choices: [] }), JSON_HEADERS);
    const messages = [{ role: QueryAssistantRole.User, content: 'total cost by deployment' }];

    await instance.chatCompletion(messages, 'applications/public/app', TOKEN_MOCK);

    const [, init] = (fetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0];
    expect(JSON.parse(init.body as string)).toEqual({ messages, stream: false });
  });

  test('returns a failure response on a non-ok status', async () => {
    fetch.mockResponseOnce('nope', { status: 404 });

    const res = await instance.chatCompletion(
      [{ role: QueryAssistantRole.User, content: 'x' }],
      'applications/public/app',
      TOKEN_MOCK,
    );

    expect(res.success).toBe(false);
    expect(res.status).toBe(404);
  });
});
