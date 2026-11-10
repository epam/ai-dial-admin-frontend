import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { getAllRunners } from '@/src/app/[lang]/platform-app-runners/actions';
import { getTranslators } from '@/src/app/[lang]/platform-translators/actions';
import RouterView from '@/src/components/Assets/Platform/Routers/View';
import { buildAppRunnerOptions } from '@/src/components/SourceField/Application/utils';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialRouterResource } from '@/src/models/dial/resource';
import { DialRole } from '@/src/models/dial/role';
import { readCatalogSchemaOptions } from '@/src/server/catalog-schemas/read-options';
import { readConfigEntities } from '@/src/server/config-entities/read-page-options';
import { ResourceInfo } from '@/src/server/core/asset-metadata';
import { errorObjLog } from '@/src/server/logger';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getConfigFileRouter, getRouter } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ configFile?: string }>;
}) {
  const isConfigFileMode = (await params.searchParams).configFile === 'true';
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let etag = DEFAULT_ETAG;
  let router: DialRouterResource | null = null;
  let translators: ResourceInfo[] = [];
  let platformSchemas: ResourceInfo[] = [];

  const optionWarnings: EntitiesI18nKey[] = [];

  try {
    const path = (await params.params).id;

    if (isConfigFileMode) {
      const result = await getConfigFileRouter(path);
      router = result.success ? result.data : null;
    } else {
      router = await getRouter(decodeURIComponent(path), etag).then((res) => {
        etag = res?.etag || DEFAULT_ETAG;
        return res?.response as DialRouterResource | null;
      });
      translators = (await getTranslators('')) || [];
    }

    platformSchemas = await getAllRunners();
  } catch (e) {
    errorObjLog(e, 'Failed to fetch router view data');
  }

  // Deliberately outside the resource fetch's try, and resolved together: an option-list problem must not
  // prevent the router from loading, and one list failing must not skip another. Core-direct, as for
  // Platform > Models. The schema list is the one the application source picker offers: configuration-file
  // schemas plus platform App Runners.
  const [roles, fileSchemas, catalogSchemas] = await Promise.all([
    readConfigEntities<DialRole>(token, ConfigFileEntityType.Roles, optionWarnings),
    readConfigEntities<DialApplicationScheme>(token, ConfigFileEntityType.Schemas, optionWarnings, true),
    readCatalogSchemaOptions(token),
  ]);

  if (router == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <RouterView
        etag={etag}
        originalRouter={router}
        roles={roles}
        optionWarnings={optionWarnings}
        translators={translators}
        catalogSchemas={catalogSchemas}
        schemes={buildAppRunnerOptions(fileSchemas, platformSchemas)}
        isConfigFileSource={isConfigFileMode}
      />
    </SaveValidationContextProvider>
  );
}
