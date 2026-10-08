import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { getAllRunners } from '@/src/app/[lang]/platform-app-runners/actions';
import { applicationRunnersApi, publicationsApi } from '@/src/app/api/api';
import PublicationView from '@/src/components/Publications/View/View';
import { buildAppRunnerOptions } from '@/src/components/SourceField/Application/utils';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { Publication } from '@/src/models/dial/publications';
import { ResourceInfo } from '@/src/server/core/asset-metadata';
import { readConfigEntities } from '@/src/server/config-entities/read-page-options';
import { errorObjLog } from '@/src/server/logger';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page(params: { searchParams: Promise<{ path: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let data: Publication | null = null;
  let applicationSchemes: DialApplicationScheme[] | null = null;
  let assetRunners: ResourceInfo[] = [];

  try {
    data = await publicationsApi.getPublication(token, (await params.searchParams).path);
    assetRunners = await getAllRunners();
    applicationSchemes = process.env.DIAL_ADMIN_API_URL
      ? await applicationRunnersApi.getApplicationSchemesList(token)
      : await readConfigEntities<DialApplicationScheme>(token, ConfigFileEntityType.Schemas, [], true);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch application publication view data');
  }

  if (data == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <PublicationView
        publication={data as Publication}
        view={ApplicationRoute.ApplicationPublications}
        applicationSchemes={buildAppRunnerOptions(applicationSchemes, assetRunners)}
      />
    </SaveValidationContextProvider>
  );
}
