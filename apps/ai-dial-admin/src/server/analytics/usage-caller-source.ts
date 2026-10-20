import { cookies, headers } from 'next/headers';

import { analyticsDataApi } from '@/src/app/api/api';
import { USAGE_ENTITY, USAGE_USER_HASH_FIELD, USAGE_USER_REF_FIELD } from '@/src/components/Analytics/Usage/constants';
import { CallerSource } from '@/src/components/Analytics/Usage/models';
import { withEntitySchemaCache } from '@/src/server/analytics/entity-schema-cache';
import { errorObjLog } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

// A failed read falls back to the hash, which every environment ships.
export async function getCallerSource(): Promise<CallerSource> {
  try {
    const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
    const schemaRead = await withEntitySchemaCache(USAGE_ENTITY, token, () =>
      analyticsDataApi.getEntitySchema(USAGE_ENTITY, token),
    );

    if (!schemaRead.response) {
      return CallerSource.Hash;
    }

    const names = new Set(schemaRead.response.fields?.map(({ name }) => name));
    const hasRef = names.has(USAGE_USER_REF_FIELD);
    const hasHash = names.has(USAGE_USER_HASH_FIELD);

    if (hasRef) {
      return hasHash ? CallerSource.Principal : CallerSource.Reference;
    }

    return hasHash ? CallerSource.Hash : CallerSource.None;
  } catch (e) {
    errorObjLog(e, 'Failed to read the usage log schema');
    return CallerSource.Hash;
  }
}
