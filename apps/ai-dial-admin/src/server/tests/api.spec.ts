import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { BaseApi } from '../base-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

const TEST_URL = 'test';
const TEST_GET_URL = `${TEST_URL}/get`;

describe('Server - api', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should check error with status code', async () => {
    fetch.mockResponseOnce(JSON.stringify('Error get'), { status: 400 });
    (new BaseApi({ host: '' }) as any).get(TEST_GET_URL).then((res) => {
      expect(res).toBeNull();
    });
  });

  test('Should check return texts', async () => {
    fetch.mockResponseOnce(JSON.stringify('Response text'), { status: 200, headers: {} });
    (new BaseApi({ host: '' }) as any).get(TEST_GET_URL).then((res) => {
      expect(JSON.parse(res)).toBe('Response text');
    });
  });

  test('Should check return texts', async () => {
    const error = { success: false, errorHeader: 'Request error', errorMessage: 'Error status: 400', status: 400 };
    fetch.mockResponseOnce(JSON.stringify('Error get'), {
      status: 400,
      error: JSON.stringify({ message: 'message', error: 'header' }),
    } as any);
    (new BaseApi({ host: '' }) as any).getAction(TEST_GET_URL).then((res) => {
      expect(res).toEqual(error);
    });
  });
});
