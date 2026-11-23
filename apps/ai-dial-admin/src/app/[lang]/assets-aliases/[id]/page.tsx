import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { getAlias, getAliasHealthIssue, getConfigFileAlias } from '@/src/app/[lang]/assets-aliases/actions';
import AliasView from '@/src/components/Assets/Entities/Aliases/View/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialAliasResource } from '@/src/models/dial/alias';
import { DialRole } from '@/src/models/dial/role';
import { readConfigEntities } from '@/src/server/config-entities/read-page-options';
import { errorObjLog } from '@/src/server/logger';
import { isFullAdminCaller } from '@/src/server/user-access';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { PLATFORM_ROOT_FOLDER, isPlatformBucketDetailRoute } from '@/src/utils/files/root-folder';

export const dynamic = 'force-dynamic';

/**
 * `/assets-aliases/{name}` is a platform alias, `/assets-aliases/{name}?path=public/{name}` a public one — the `path`
 * marker is what tells the two buckets apart, as on the Applications and Toolsets detail routes — and
 * `?configFile=true` a read-only alias declared in the config file.
 */
export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ path?: string; configFile?: string }>;
}) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const searchParams = await params.searchParams;
  const isConfigFileMode = searchParams.configFile === 'true';
  const isPlatformBucket = isPlatformBucketDetailRoute(searchParams.path);
  const name = decodeURIComponent((await params.params).id);
  const optionWarnings: EntitiesI18nKey[] = [];

  let etag = DEFAULT_ETAG;
  let alias: DialAliasResource | null = null;

  try {
    if (isConfigFileMode) {
      const result = await getConfigFileAlias(name);
      alias = result.success ? result.data : null;
    } else {
      const path = isPlatformBucket
        ? `${PLATFORM_ROOT_FOLDER}/${name}`
        : decodeURIComponent(searchParams.path as string);

      alias = await getAlias(path, etag).then((res) => {
        etag = res?.etag || DEFAULT_ETAG;
        return res?.response ?? null;
      });
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch alias data');
  }

  // Outside the alias fetch's try: an option-list problem must not stop the alias from loading. Core-direct, not
  // the admin-backend role list, which cannot see a role declared only in Core's configuration file.
  const isFullAdmin = await isFullAdminCaller();
  const roles = isFullAdmin
    ? await readConfigEntities<DialRole>(token, ConfigFileEntityType.Roles, optionWarnings)
    : [];

  if (alias == null) {
    notFound();
  }

  // Admins only: Core answers the health report to nobody else. Outside the fetch's try for the same reason as the roles.
  const isPublicSource = !isPlatformBucket && !isConfigFileMode;
  const healthIssue = isFullAdmin ? await getAliasHealthIssue(name, isPublicSource) : undefined;

  return (
    <SaveValidationContextProvider>
      <AliasView
        etag={etag}
        originalAlias={alias}
        roles={roles}
        healthIssue={healthIssue}
        isConfigFileSource={isConfigFileMode}
        isPublicSource={isPublicSource}
      />
    </SaveValidationContextProvider>
  );
}
