import { RESPONSE_MOCK, TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { TEST_SUITS_URL, TEST_SUIT_URL, TestSuitsApi } from '../test-suits-api';
import { TestSuits } from '@/src/models/evaluation/test-suit';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: TestSuitsApi', () => {
  const instance = new TestSuitsApi({ host: TEST_URL });

  const mockTestSuit: TestSuits = {
    id: 'tess',
    description: 'Test',
  };

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should calls getTestSuits and return list', async () => {
    fetch.mockResponseOnce(JSON.stringify([mockTestSuit]));

    const result = await instance.getTestSuits(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(`${TEST_URL}${TEST_SUITS_URL}`, expect.objectContaining({ method: 'GET' }));
  });

  test('Should calls getTestSuit by name and return testSuit', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockTestSuit));

    const result = await instance.getTestSuit(mockTestSuit.id as string, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUIT_URL(mockTestSuit.id)}`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.response).toEqual(JSON.stringify(mockTestSuit));
  });

  test('Should calls createTestSuit with correct payload', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.createTestSuit(mockTestSuit, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUIT_URL(mockTestSuit.id)}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(mockTestSuit),
      }),
    );
  });

  test('Should calls updateTestSuit with correct payload', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.updateTestSuit(mockTestSuit, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUIT_URL(mockTestSuit.id)}`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(mockTestSuit),
      }),
    );
  });

  test('Should calls removeTestSuit with DELETE method', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.removeTestSuit(mockTestSuit.id, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUIT_URL(mockTestSuit.id)}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
