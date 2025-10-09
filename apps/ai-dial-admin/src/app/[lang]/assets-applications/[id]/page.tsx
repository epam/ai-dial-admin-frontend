import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { applicationRunnersApi, applicationsApi, assetsApi, interceptorsApi, modelsApi } from '@/src/app/api/api';
import AppView from '@/src/components/Assets/AppView/AppView';
import Page403 from '@/src/components/Page403/Page403';
import { AppsFolderProvider } from '@/src/context/AppsFolderContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialAssetApp } from '@/src/models/dial/asset-app';
import { DialFileNodeType } from '@/src/models/dial/file';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { logError } from '@/src/server/logger';
import { ResourceType } from '@/src/types/folder';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ path: string }>;
}) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let apps: DialAssetApp[] = [];
  let app: DialAssetApp | null = null;

  let models: DialModel[] | null = [];
  let applications: DialApplication[] | null = [];

  let applicationSchemes: DialApplicationScheme[] | null = [];
  let interceptors: DialInterceptor[] | null = [];

  try {
    const path = decodeURIComponent((await params.searchParams).path);
    const name = decodeURIComponent((await params.params).id);

    app = await assetsApi.getAsset(token, path, ResourceType.APPLICATION);
    if (app === void 0) {
      return <Page403 />;
    }
    apps = ((await assetsApi.getAssetList(token, `${app?.folderId}/`, ResourceType.APPLICATION))?.filter(
      (p) => p.nodeType === DialFileNodeType.ITEM && p.name === name,
    ) || []) as DialAssetApp[];

    models = await modelsApi.getModelsList(token);
    applications = await applicationsApi.getApplicationsList(token);

    applicationSchemes = await applicationRunnersApi.getApplicationSchemesList(token);
    interceptors = await interceptorsApi.getInterceptorsList(token);
  } catch (e) {
    logError(e, 'Failed to fetch app view data');
  }
  if (app == null) {
    redirect(ApplicationRoute.AssetsApplications);
  }

  return (
    <SaveValidationContextProvider>
      <AppsFolderProvider>
        <AppView
          originalApp={app}
          apps={apps || []}
          models={models || []}
          applications={applications || []}
          schemes={applicationSchemes || []}
          interceptors={interceptors || []}
        />
      </AppsFolderProvider>
    </SaveValidationContextProvider>
  );
}
