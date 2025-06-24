import { DialPrompt } from '@/src/models/dial/prompt';
import { ServerActionResponse } from '@/src/models/server-action';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { PROMPT_DELETE_URL, PROMPT_LIST_URL, PromptsApi } from '../prompts-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();
describe('Server :: PromptsApi', () => {
  const instance = new PromptsApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should calls getPromptsList and returns prompts', async () => {
    const mockPrompts: DialPrompt[] = [{ id: '1', name: 'Test', content: '', folderId: 'root' } as DialPrompt];

    fetchMock.mockResponseOnce(JSON.stringify({ items: mockPrompts }));

    await instance.getPromptsList(TOKEN_MOCK, '/prompts');

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${PROMPT_LIST_URL}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path: '/prompts' }),
      }),
    );
  });

  test('Should calls removePrompt and calls POST and returns response', async () => {
    const mockResponse: ServerActionResponse = { success: true };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.removePrompt(TOKEN_MOCK, '/prompts/sample.json');

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${PROMPT_DELETE_URL}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path: '/prompts/sample.json' }),
      }),
    );
  });

  test('Should calls movePrompts and sends POST requests per file and returns responses', async () => {
    const mockResponse: ServerActionResponse = { success: true };
    fetchMock.mockResponse(JSON.stringify(mockResponse));

    const paths = ['/old/prompt1', '/old/prompt2'];
    await instance.movePrompts(TOKEN_MOCK, paths, '/new');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
