import { beforeEach, describe, expect, test, vi } from 'vitest';

import { analyticsDataApi } from '@/src/app/api/api';
import { USAGE_ENTITY, USAGE_USER_HASH_FIELD, USAGE_USER_REF_FIELD } from '@/src/components/Analytics/Usage/constants';
import { CallerSource } from '@/src/components/Analytics/Usage/models';
import { clearEntitySchemaCache } from '@/src/server/analytics/entity-schema-cache';
import { getCallerSource } from '@/src/server/analytics/usage-caller-source';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

vi.mock('@/src/app/api/api');
vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn(), errorLog: vi.fn() }));

const getEntitySchema = () => analyticsDataApi.getEntitySchema as unknown as ReturnType<typeof vi.fn>;

const schemaWith = (...names: string[]) => ({ success: true, response: { fields: names.map((name) => ({ name })) } });

beforeEach(() => {
  vi.clearAllMocks();
  clearEntitySchemaCache();
  (getIsEnableAuthToggle as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
  (getUserToken as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(TOKEN_MOCK);
});

describe('getCallerSource', () => {
  test('counts by the principal reference where the schema serves it', async () => {
    getEntitySchema().mockResolvedValue(schemaWith(USAGE_USER_HASH_FIELD, USAGE_USER_REF_FIELD));

    await expect(getCallerSource()).resolves.toBe(CallerSource.Principal);
  });

  test('counts by the principal reference alone where the hash is withheld', async () => {
    getEntitySchema().mockResolvedValue(schemaWith(USAGE_USER_REF_FIELD));

    await expect(getCallerSource()).resolves.toBe(CallerSource.Reference);
  });

  test('counts by the hash where the enrichment is not provisioned', async () => {
    getEntitySchema().mockResolvedValue(schemaWith(USAGE_USER_HASH_FIELD));

    await expect(getCallerSource()).resolves.toBe(CallerSource.Hash);
  });

  test('counts nothing where the schema serves neither column', async () => {
    getEntitySchema().mockResolvedValue(schemaWith('request_time'));

    await expect(getCallerSource()).resolves.toBe(CallerSource.None);
  });

  test('falls back to the hash where the schema cannot be read', async () => {
    getEntitySchema().mockResolvedValue({ success: false, status: 500 });

    await expect(getCallerSource()).resolves.toBe(CallerSource.Hash);
  });

  test('resolves instead of rejecting when the service is unreachable', async () => {
    getEntitySchema().mockRejectedValue(new TypeError('fetch failed'));

    await expect(getCallerSource()).resolves.toBe(CallerSource.Hash);
  });

  test('reads the usage log schema with the user token', async () => {
    getEntitySchema().mockResolvedValue(schemaWith(USAGE_USER_HASH_FIELD));

    await getCallerSource();

    expect(getEntitySchema()).toHaveBeenCalledWith(USAGE_ENTITY, TOKEN_MOCK);
  });
});
