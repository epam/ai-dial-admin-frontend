import { analyticsDataApi, sessionsSourceApi } from '@/src/app/api/api';
import { DEFAULT_SESSIONS_SOURCE_SETTING } from '@/src/constants/analytics/sessions-source';
import { Token } from '@/src/models/auth';
import { withEntitySchemaCache } from '@/src/server/analytics/entity-schema-cache';
import { errorObjLog } from '@/src/server/logger';
import { isEntityMissing } from '@/src/utils/analytics/sessions-source';

export const isSessionsSourceAvailable = async (token: Token): Promise<boolean> => {
  try {
    const setting = await sessionsSourceApi.getSetting(token);

    if (!setting.success || setting.response) {
      return true;
    }

    const { baseTable } = DEFAULT_SESSIONS_SOURCE_SETTING;
    const schema = await withEntitySchemaCache(baseTable, token, () =>
      analyticsDataApi.getEntitySchema(baseTable, token),
    );

    return !isEntityMissing(schema);
  } catch (error) {
    errorObjLog(error, 'Failed to decide whether the Sessions page is available');
    return true;
  }
};
