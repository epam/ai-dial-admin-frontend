import { describe, test, expect, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { GLOBAL_FIREWALL_REVISION_URL, GLOBAL_FIREWALL_ROLLBACK_URL, GlobalFirewallApi } from '../global-firewall';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('GlobalFirewallApi', () => {
  const instance = new GlobalFirewallApi({ host: TEST_URL });

  test('getRevisionDetails GETs revision URL', async () => {
    fetch.mockResponseOnce(JSON.stringify([]));
    await instance.getRevisionDetails(2, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(GLOBAL_FIREWALL_REVISION_URL(2)),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('rollbackToRevision POSTs to /global-whitelist/image-build/revision/{revision}/rollback', async () => {
    fetch.mockResponseOnce(JSON.stringify([]));
    await instance.rollbackToRevision(4, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(GLOBAL_FIREWALL_ROLLBACK_URL(4)),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
