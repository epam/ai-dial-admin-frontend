import { cookies, headers } from 'next/headers';

import { applicationRunnersApi } from '@/src/app/api/api';
import { getAllRunners } from '@/src/app/[lang]/platform-app-runners/actions';
import AppsList from '@/src/components/Assets/Apps/List';
import { buildAppRunnerOptions } from '@/src/components/SourceField/Application/utils';
import { AppRunnerOption } from '@/src/components/SourceField/Application/models';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ResourceInfo } from '@/src/server/core/asset-metadata';
import { errorObjLog } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let runners: DialApplicationScheme[] | null = [];
  let assetRunners: ResourceInfo[] = [];

  try {
    runners = await applicationRunnersApi.getApplicationSchemesList(token);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch applications data');
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
