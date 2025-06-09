import fetch from 'jest-fetch-mock';
import { AdaptersApi } from '../adapters-api';
import { DialAdapter } from '@/src/models/dial/adapter';
import { ServerActionResponse } from '@/src/models/server-action';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

const adapter: DialAdapter = {
  name: 'test-adapter',
  description: 'Test adapter',
} as DialAdapter;

describe('Server :: Adapters', () => {
  const instance = new AdaptersApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });
  it('Should calls getAdaptersList with list of adapters', async () => {
    fetch.mockResponseOnce(JSON.stringify([adapter]));

    const result = await instance.getAdaptersList(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/adapters'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual(JSON.stringify([adapter]));
  });

  it('Should calls getAdaptersListAction returns server action response', async () => {
    const mockResponse: ServerActionResponse = { success: true };
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.getAdaptersListAction(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/adapters'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('Should calls createAdapter and posts new adapter', async () => {
    const mockResponse: ServerActionResponse = { success: true };
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.createAdapter(adapter, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/adapters'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(adapter) }),
    );
  });

  it('Should calls removeAdapter and deletes the adapter', async () => {
    const mockResponse: ServerActionResponse = { success: true };
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.removeAdapter(TOKEN_MOCK, adapter.name);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/adapters/${adapter.name}`),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('Should calls getAdapter and fetches a specific adapter', async () => {
    fetch.mockResponseOnce(JSON.stringify(adapter));

    const result = await instance.getAdapter(adapter.name, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/adapters/${adapter.name}`),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual(JSON.stringify(adapter));
  });

  it('Should calls updateAdapter and sends updated data via PUT', async () => {
    const mockResponse: ServerActionResponse = { success: true };
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.updateAdapter(adapter, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/adapters/${adapter.name}`),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(adapter),
      }),
    );
  });
});
