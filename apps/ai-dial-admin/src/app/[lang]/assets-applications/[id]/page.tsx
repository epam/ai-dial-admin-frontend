import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { getModelsList } from '@/src/app/[lang]/models/actions';
import { applicationRunnersApi, applicationsApi, interceptorsApi } from '@/src/app/api/api';
import AppView from '@/src/components/Assets/Apps/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { Asset, AssetApp } from '@/src/models/dial/deployment-asset';
import { DialFileNodeType } from '@/src/models/dial/file';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { errorObjLog } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getApp, getApps } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ path: string }>;
}) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let etag = DEFAULT_ETAG;

  let apps: AssetApp[] = [];
  let app: AssetApp | null = null;

  let models: DialModel[] | null = [];
  let applications: DialApplication[] | null = [];

  let applicationSchemes: DialApplicationScheme[] | null = [];
  let interceptors: DialInterceptor[] | null = [];

  try {
    const path = decodeURIComponent((await params.searchParams).path);
    const name = decodeURIComponent((await params.params).id);

    app = await getApp(path, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as AssetApp | null;
    });

    apps = ((await getApps(app?.folderId as string))?.filter(
      (p) => (p as Asset).nodeType === DialFileNodeType.ITEM && p.name === name,
    ) || []) as AssetApp[];

    models = await getModelsList();
    applications = await applicationsApi.getApplicationsList(token);

    applicationSchemes = await applicationRunnersApi.getApplicationSchemesList(token);
    interceptors = await interceptorsApi.getInterceptorsList(token);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch app view data');
  }
  if (app == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <AppView
        etag={etag}
        originalApp={app}
        assets={apps || []}
        models={models || []}
        applications={applications || []}
        schemes={applicationSchemes || []}
        interceptors={interceptors || []}
      />
    </SaveValidationContextProvider>
  );
}
