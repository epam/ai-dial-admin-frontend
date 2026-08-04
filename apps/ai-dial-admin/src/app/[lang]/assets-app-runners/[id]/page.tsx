import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import AppRunnerAssetView from '@/src/components/Assets/AppRunners/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Token } from '@/src/models/auth';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialAppRunnerResource } from '@/src/models/dial/resource';
import { DialRole } from '@/src/models/dial/role';
import { getConfigEntityOptions, getGlobalInterceptors } from '@/src/server/config-entities/read';
import { errorLog, errorObjLog } from '@/src/server/logger';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { toConfigEntityRows } from '@/src/utils/config-entities/rows';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getRunner } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ path: string }>;
}) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let etag = DEFAULT_ETAG;
  let runner: DialAppRunnerResource | null = null;
  const optionWarnings: EntitiesI18nKey[] = [];

  try {
    // Next already decodes the query param once, which restores the singly-encoded resource name
    // `ResourceInfo.path` carries. Decoding again would expose the `$id`'s `:` and `/`, and
    // `encodeCorePath` would then split it into path segments instead of one resource name.
    const path = (await params.searchParams).path;

    runner = await getRunner(path, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as DialAppRunnerResource | null;
    });
  } catch (e) {
    errorObjLog(e, 'Failed to fetch app runner asset data');
  }

  // Deliberately outside the resource fetch's try, and resolved together: an option-list problem must
  // not prevent the runner from loading, and one list failing must not skip the others.
  const [roles, interceptors, globalInterceptors] = await Promise.all([
    readConfigEntities<DialRole>(token, ConfigFileEntityType.Roles, optionWarnings),
    readConfigEntities<DialInterceptor>(token, ConfigFileEntityType.Interceptors, optionWarnings),
    readGlobalInterceptors(token, optionWarnings),
  ]);

  if (runner == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <AppRunnerAssetView
        etag={etag}
        originalRunner={runner}
        roles={roles}
        interceptors={interceptors}
        globalInterceptors={globalInterceptors}
        optionWarnings={optionWarnings}
      />
    </SaveValidationContextProvider>
  );
}

/**
 * Both option lists come from DIAL Core's merged configuration — the union of its API-written and
 * config-file populations — so every option offered here resolves in the same map Core validates a
 * reference against. A partial read still returns the population it could read, and says so.
 *
 * Warnings are pushed as i18n keys rather than sentences: this runs on the server, where no translator
 * is available, so the client component resolves them.
 */
async function readConfigEntities<T>(
  token: Token,
  type: ConfigFileEntityType,
  warnings: EntitiesI18nKey[],
): Promise<T[]> {
  const result = await getConfigEntityOptions(token, type);

  if (!result.success) {
    errorLog(`Failed to read ${type} options from Core: ${result.failure.reason} ${result.failure.errorMessage ?? ''}`);
    warnings.push(EntitiesI18nKey.OptionListUnavailable);
    return [];
  }

  result.data.failures.forEach((failure) => {
    errorLog(`Partial ${type} option read from Core: ${failure.reason} ${failure.errorMessage ?? ''}`);
    warnings.push(EntitiesI18nKey.OptionListPartial);
  });

  return toConfigEntityRows(result.data.options, type) as T[];
}

/**
 * A failed read is reported rather than passed off as an empty chain: the tab numbers the runner's own
 * interceptors after the global ones, so silently treating "unreadable" as "none configured" would
 * misstate the actual execution order.
 */
async function readGlobalInterceptors(token: Token, warnings: EntitiesI18nKey[]): Promise<string[]> {
  const result = await getGlobalInterceptors(token);

  if (result.success) {
    return result.data;
  }

  errorLog(`Failed to read global interceptors from Core: ${result.failure.errorMessage ?? ''}`);
  warnings.push(EntitiesI18nKey.GlobalInterceptorsUnavailable);
  return [];
}
