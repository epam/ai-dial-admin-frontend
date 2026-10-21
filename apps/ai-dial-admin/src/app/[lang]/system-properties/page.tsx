import { cookies, headers } from 'next/headers';

import { settingsApi } from '@/src/app/api/api';
import SystemProperties from '@/src/components/SystemProperties/SystemProperties';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { GlobalSettings } from '@/src/models/system-properties';
import { readConfigEntities } from '@/src/server/config-entities/read-page-options';
import { errorObjLog } from '@/src/server/logger';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

const HTTP_NOT_FOUND = 404;

export const dynamic = 'force-dynamic';

export default async function Page() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let globalSettings: GlobalSettings | null = null;
  // Core never returns an ETag for this singleton (on 200 or 404), so a save can only assert
  // existence — see settings-api.ts and putActionWithEtag.
  let doesSettingsExist = false;
  const optionWarnings: EntitiesI18nKey[] = [];

  try {
    const res = await settingsApi.getSystemProperties(token, DEFAULT_ETAG);

    if (res.success) {
      doesSettingsExist = true;
      globalSettings = res.response as GlobalSettings;
    } else if (res.status !== HTTP_NOT_FOUND) {
      // A 404 just means no settings blob has been saved via the API yet — not an error.
      optionWarnings.push(EntitiesI18nKey.SystemPropertiesReadFailed);
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch system properties view data');
  }

  // Core-direct — matching Assets > Models / Assets > App Runners — rather than the admin-BE list,
  // which cannot see interceptors declared in Core's configuration file: `readConfigEntities` already
  // unions the API-written ("Entities") and config-file ("Catalog") populations (and itself skips the
  // read without the admin backend, since there is then no API-written population to union).
  const interceptors = await readConfigEntities<DialInterceptor>(
    token,
    ConfigFileEntityType.Interceptors,
    optionWarnings,
  );

  return (
    <SaveValidationContextProvider>
      <SystemProperties
        interceptors={interceptors}
        globalSettings={globalSettings}
        doesSettingsExist={doesSettingsExist}
        optionWarnings={optionWarnings}
      />
    </SaveValidationContextProvider>
  );
}
