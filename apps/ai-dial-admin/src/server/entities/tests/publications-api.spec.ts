import { PublicationsApi } from '../publications-api';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import fetch from 'jest-fetch-mock';
import { Publication } from '@/src/models/dial/publications';

describe('Server :: Publications', () => {
  const instance = new PublicationsApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  it('Should calls publications prompts list', async () => {
    const mockPublications: Publication[] = [
      { id: '1', title: 'Test Prompt 1' },
      { id: '2', title: 'Test Prompt 2' },
    ];
    fetch.mockResponseOnce(JSON.stringify({ publications: mockPublications }));

    await instance.getPublicationsPromptsList(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/publications?type=prompt'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('Should calls publications files list', async () => {
    const mockPublications: Publication[] = [
      { id: '10', title: 'File 1' },
      { id: '20', title: 'File 2' },
    ];
    fetch.mockResponseOnce(JSON.stringify({ publications: mockPublications }));

    await instance.getPublicationsFilesList(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/publications?type=file'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('Should calls getPublication', async () => {
    const mockPublication: Publication = { id: '123', title: 'Single Publication' };
    fetch.mockResponseOnce(JSON.stringify(mockPublication));

    const path = '/some/path';
    const result = await instance.getPublication(TOKEN_MOCK, path);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/publications/get'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path }),
        headers: expect.anything(),
      }),
    );
    expect(result).toEqual(JSON.stringify(mockPublication));
  });

  it('Should calls declinePublication', async () => {
    const mockResponse = { success: true };
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    const path = '/decline/path';
    const comment = 'No good';
    await instance.declinePublication(TOKEN_MOCK, path, comment);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/publications/reject'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path, comment }),
        headers: expect.anything(),
      }),
    );
  });

  it('Should calls approvePublication', async () => {
    const mockResponse = { success: true };
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    const path = '/approve/path';
    await instance.approvePublication(TOKEN_MOCK, path);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/publications/approve'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path }),
        headers: expect.anything(),
      }),
    );
  });
});
