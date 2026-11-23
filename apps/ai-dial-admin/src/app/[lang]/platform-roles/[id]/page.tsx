import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import RoleAssetView from '@/src/components/Assets/Platform/Roles/View';
import { PlatformRoleModelOption } from '@/src/components/Assets/Platform/Roles/models';
import Page403 from '@/src/components/Page403/Page403';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialRoleResource } from '@/src/models/dial/resource';
import { readConfigEntities } from '@/src/server/config-entities/read-page-options';
import { errorObjLog } from '@/src/server/logger';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getConfigFileRole, getRole } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ configFile?: string }>;
}) {
  let isConfigFileMode = (await params.searchParams).configFile === 'true';
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const optionWarnings: EntitiesI18nKey[] = [];

  let etag = DEFAULT_ETAG;
  let role: DialRoleResource | null = null;

  // Next.js has already decoded the route segment; decoding it again corrupts literal percent sequences.
  const path = (await params.params).id;

  if (!isConfigFileMode) {
    let result;
    try {
      result = await getRole(path, etag);
    } catch (e) {
      errorObjLog(e, 'Failed to fetch role asset data');
      throw new Error('Failed to fetch role asset data');
    }

    if (
      result.success &&
      result.response &&
      typeof result.response === 'object' &&
      !Array.isArray(result.response) &&
      typeof result.response._metadata?.name === 'string'
    ) {
      role = result.response;
      etag = result.etag || DEFAULT_ETAG;
    } else if (!result.success && result.status === 404) {
      isConfigFileMode = true;
    } else if (!result.success && (result.status === 401 || result.status === 403)) {
      return <Page403 />;
    } else {
      throw new Error('Failed to fetch role asset data');
    }
  }

  if (isConfigFileMode) {
    let result;
    try {
      result = await getConfigFileRole(path);
    } catch (e) {
      errorObjLog(e, 'Failed to fetch config-file role data');
      throw new Error('Failed to fetch config-file role data');
    }

    if (
      result.success &&
      result.data &&
      typeof result.data === 'object' &&
      !Array.isArray(result.data) &&
      typeof result.data.name === 'string'
    ) {
      role = result.data as unknown as DialRoleResource;
    } else if (!result.success && result.failure.status === 404) {
      notFound();
    } else if (!result.success && (result.failure.status === 401 || result.failure.status === 403)) {
      return <Page403 />;
    } else {
      throw new Error('Failed to fetch config-file role data');
    }
  }

  if (role == null) {
    throw new Error('Failed to fetch role asset data');
  }

  const models = await readConfigEntities<PlatformRoleModelOption>(token, ConfigFileEntityType.Models, optionWarnings);

  return (
    <SaveValidationContextProvider>
      <RoleAssetView
        etag={etag}
        originalRole={role}
        models={models}
        optionWarnings={optionWarnings}
        isConfigFileSource={isConfigFileMode}
      />
    </SaveValidationContextProvider>
  );
}
