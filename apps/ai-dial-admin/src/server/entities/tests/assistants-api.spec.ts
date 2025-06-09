import fetch from 'jest-fetch-mock';
import { AssistantsApi, ASSISTANTS_URL, ASSISTANT_URL } from '../assistants-api';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { DialAssistant } from '@/src/models/dial/assistant';

describe('Server :: AssistantsApi', () => {
  const instance = new AssistantsApi({ host: TEST_URL });

  const mockAssistant: DialAssistant = {
    name: 'test-assistant',
    description: 'Test Assistant',
  };

  beforeEach(() => {
    fetch.resetMocks();
  });

  it('Should fetch assistants list', async () => {
    fetch.mockResponseOnce(JSON.stringify([mockAssistant]));

    const result = await instance.getAssistantsList(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(`${TEST_URL}${ASSISTANTS_URL}`, expect.objectContaining({ method: 'GET' }));
    expect(result).toEqual(JSON.stringify([mockAssistant]));
  });

  it('Should fetch a single assistant', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockAssistant));

    const result = await instance.getAssistant(mockAssistant.name, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${ASSISTANT_URL(mockAssistant.name)}`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual(JSON.stringify(mockAssistant));
  });

  it('Should create an assistant', async () => {
    const response = { success: true };
    fetch.mockResponseOnce(JSON.stringify(response));

    const result = await instance.createAssistant(mockAssistant, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${ASSISTANTS_URL}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(mockAssistant),
      }),
    );
  });

  it('Should update an assistant', async () => {
    const response = { success: true };
    fetch.mockResponseOnce(JSON.stringify(response));

    const result = await instance.updateAssistant(mockAssistant, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${ASSISTANT_URL(mockAssistant.name)}`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(mockAssistant),
      }),
    );
  });

  it('Should delete an assistant', async () => {
    const response = { success: true };
    fetch.mockResponseOnce(JSON.stringify(response));

    const result = await instance.removeAssistant(TOKEN_MOCK, mockAssistant.name);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${ASSISTANT_URL(mockAssistant.name)}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
