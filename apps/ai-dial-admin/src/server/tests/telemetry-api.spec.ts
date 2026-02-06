import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { TelemetryApi } from '../telemetry-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: TelemetryApi', () => {
  const instance = new TelemetryApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('should fetch backend version', async () => {
    fetch.mockResponseOnce('1.2.3');

    await instance.getDashboardData({}, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/metrics/datasets/dial_analytics_realtime/data'),
      expect.anything(),
    );
  });
});
