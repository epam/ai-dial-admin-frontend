import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import RoleAssetView from '@/src/components/Assets/Platform/Roles/View';
import { PlatformRoleModelOption } from '@/src/components/Assets/Platform/Roles/models';
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
  const isConfigFileMode = (await params.searchParams).configFile === 'true';
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const optionWarnings: EntitiesI18nKey[] = [];

  let etag = DEFAULT_ETAG;
  let role: DialRoleResource | null = null;

  try {
    const path = (await params.params).id;

    if (isConfigFileMode) {
      const result = await getConfigFileRole(path);
      role = result.success ? (result.data as unknown as DialRoleResource) : null;
    } else {
      role = await getRole(decodeURIComponent(path), etag).then((res) => {
        etag = res?.etag || DEFAULT_ETAG;
        return res?.response as DialRoleResource | null;
      });
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch role asset data');
  }

  const models = await readConfigEntities<PlatformRoleModelOption>(token, ConfigFileEntityType.Models, optionWarnings);

  if (role == null) {
    notFound();
  }

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
