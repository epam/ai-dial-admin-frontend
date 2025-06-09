import fetch from 'jest-fetch-mock';
import { KeysApi, KEYS_URL, KEY_URL } from '../keys-api';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { DialKey } from '@/src/models/dial/key';

describe('Server :: KeysApi', () => {
  const instance = new KeysApi({ host: TEST_URL });

  const mockKey: DialKey = {
    name: 'test-key',
    description: 'Test Key',
  };

  beforeEach(() => {
    fetch.resetMocks();
  });

  it('Should fetch list of keys', async () => {
    fetch.mockResponseOnce(JSON.stringify([mockKey]));

    const result = await instance.getKeysList(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(`${TEST_URL}${KEYS_URL}`, expect.objectContaining({ method: 'GET' }));
    expect(result).toEqual(JSON.stringify([mockKey]));
  });

  it('Should fetch a single key', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockKey));

    const result = await instance.getKey(mockKey.name, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${KEY_URL(mockKey.name)}`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual(JSON.stringify(mockKey));
  });

  it('Should create a key', async () => {
    const response = { success: true };
    fetch.mockResponseOnce(JSON.stringify(response));

    await instance.createKey(mockKey, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${KEYS_URL}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(mockKey),
      }),
    );
  });

  it('Should update a key', async () => {
    const response = { success: true };
    fetch.mockResponseOnce(JSON.stringify(response));

    await instance.updateKey(mockKey, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${KEY_URL(mockKey.name)}`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(mockKey),
      }),
    );
  });

  it('Should delete a key', async () => {
    const response = { success: true };
    fetch.mockResponseOnce(JSON.stringify(response));

    await instance.removeKey(TOKEN_MOCK, mockKey.name);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${KEY_URL(mockKey.name)}`,
      expect.objectContaining({
        method: 'DELETE',
      }),
    );
  });
});
