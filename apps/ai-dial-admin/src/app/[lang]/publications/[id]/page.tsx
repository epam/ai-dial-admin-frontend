import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { getAllRunners } from '@/src/app/[lang]/platform-app-runners/actions';
import { applicationRunnersApi, publicationsApi } from '@/src/app/api/api';
import ComplexResourcePublicationView from '@/src/components/Publications/View/ComplexResourceView';
import PublicationView from '@/src/components/Publications/View/View';
import { buildAppRunnerOptions } from '@/src/components/SourceField/Application/utils';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { Publication } from '@/src/models/dial/publications';
import { ResourceInfo } from '@/src/server/core/asset-metadata';
import { readConfigEntities } from '@/src/server/config-entities/read-page-options';
import { errorObjLog } from '@/src/server/logger';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getPublicationView, isComplexResourcePublicationView } from '@/src/utils/publications';

export const dynamic = 'force-dynamic';

interface SearchParams {
  path: string;
  type?: string;
  code?: string;
}

export default async function Page(params: { searchParams: Promise<SearchParams> }) {
  const { path, type, code } = await params.searchParams;
  const view = getPublicationView(type);

  if (view == null) {
    notFound();
  }

  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let data: Publication | null = null;
  let applicationSchemes: DialApplicationScheme[] | null = null;
  let assetRunners: ResourceInfo[] = [];

  try {
    data = await publicationsApi.getPublication(token, path);
    if (type === ResourceType.APPLICATION) {
      assetRunners = await getAllRunners();
      applicationSchemes = process.env.DIAL_ADMIN_API_URL
        ? await applicationRunnersApi.getApplicationSchemesList(token)
        : await readConfigEntities<DialApplicationScheme>(token, ConfigFileEntityType.Schemas, [], true);
    }
  } catch (e) {
    errorObjLog(e, `Failed to fetch ${type} publication view data`);
  }

  if (data == null) {
    notFound();
  }

  if (isComplexResourcePublicationView(view)) {
    return (
      <SaveValidationContextProvider>
        <ComplexResourcePublicationView publication={data} view={view} />
      </SaveValidationContextProvider>
    );
  }

  return (
    <SaveValidationContextProvider>
      <PublicationView
        publication={data}
        view={view}
        applicationSchemes={
          type === ResourceType.APPLICATION ? buildAppRunnerOptions(applicationSchemes, assetRunners) : undefined
        }
        oAuthCode={type === ResourceType.TOOLSET ? code || null : undefined}
      />
    </SaveValidationContextProvider>
  );
}
