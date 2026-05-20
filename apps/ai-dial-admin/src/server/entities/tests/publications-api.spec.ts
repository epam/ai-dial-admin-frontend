import { Publication } from '@/src/models/dial/publications';
import { RESPONSE_MOCK, TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { PublicationsApi } from '../publications-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: Publications', () => {
  const instance = new PublicationsApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should call publications prompts list', async () => {
    const mockPublications: Publication[] = [
      { id: '1', title: 'Test Prompt 1' },
      { id: '2', title: 'Test Prompt 2' },
    ];
    fetch.mockResponseOnce(JSON.stringify({ publications: mockPublications }));

    await instance.getPublicationPromptList(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/publications?type=prompt'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call toolset publications list', async () => {
    const mockPublications: Publication[] = [
      { id: '10', title: 'App 1' },
      { id: '20', title: 'App 2' },
    ];
    fetch.mockResponseOnce(JSON.stringify({ publications: mockPublications }));

    await instance.getPublicationToolsetList(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/publications?type=tool_set'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call application publications list', async () => {
    const mockPublications: Publication[] = [
      { id: '10', title: 'App 1' },
      { id: '20', title: 'App 2' },
    ];
    fetch.mockResponseOnce(JSON.stringify({ publications: mockPublications }));

    await instance.getPublicationApplicationList(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/publications?type=application'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call publications files list', async () => {
    const mockPublications: Publication[] = [
      { id: '10', title: 'File 1' },
      { id: '20', title: 'File 2' },
    ];
    fetch.mockResponseOnce(JSON.stringify({ publications: mockPublications }));

    await instance.getPublicationFileList(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/publications?type=file'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call getPublication', async () => {
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

  test('Should call declinePublication', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

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

  test('Should call approvePublication', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

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

  test('Should call deletePublication', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    const path = '/delete/path';
    await instance.deletePublication(TOKEN_MOCK, path);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/publications/delete'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path }),
        headers: expect.anything(),
      }),
    );
  });

  test('Should call updatePublication', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    const formData = new FormData();
    formData.append('publication', new Blob([JSON.stringify({ folderId: 'folder-1' })], { type: 'application/json' }));

    await instance.updatePublication(TOKEN_MOCK, formData);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/publications/update'),
      expect.objectContaining({
        method: 'POST',
        body: formData,
        headers: expect.anything(),
      }),
    );
  });
});
