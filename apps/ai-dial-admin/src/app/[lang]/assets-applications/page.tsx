import { cookies, headers } from 'next/headers';

import { getAllRunners } from '@/src/app/[lang]/platform-app-runners/actions';
import { applicationRunnersApi } from '@/src/app/api/api';
import AppsList from '@/src/components/Assets/Apps/PageList';
import { AppRunnerOption } from '@/src/components/SourceField/Application/models';
import { buildAppRunnerOptions } from '@/src/components/SourceField/Application/utils';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { readConfigEntities } from '@/src/server/config-entities/read-page-options';
import { ResourceInfo } from '@/src/server/core/asset-metadata';
import { errorObjLog } from '@/src/server/logger';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let runners: DialApplicationScheme[] | null = [];
  let assetRunners: ResourceInfo[] = [];

  // Admin-backend enrichment only: this page is otherwise Core-direct (assetRunners below), so when
  // DIAL_ADMIN_API_URL is unset there is no host to call and `runners` stays empty rather than
  // attempting a request that would fail.
  if (process.env.DIAL_ADMIN_API_URL) {
    try {
      runners = await applicationRunnersApi.getApplicationSchemesList(token);
    } catch (e) {
      errorObjLog(e, 'Failed to fetch applications data');
    }
  } else {
    [runners] = await Promise.all([
      readConfigEntities<DialApplicationScheme>(token, ConfigFileEntityType.Schemas, [], true),
    ]);
  }

  try {
    assetRunners = await getAllRunners();
  } catch (e) {
    errorObjLog(e, 'Failed to fetch asset app runners');
  }

  const options: AppRunnerOption[] = buildAppRunnerOptions(runners, assetRunners);

  return (
    <SaveValidationContextProvider>
      <AppsList runners={options} />
    </SaveValidationContextProvider>
  );
}
