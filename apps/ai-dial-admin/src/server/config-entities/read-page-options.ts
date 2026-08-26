import { EntitiesI18nKey } from '@/src/constants/i18n';
import { Token } from '@/src/models/auth';
import { getConfigEntityOptions, getGlobalInterceptors } from '@/src/server/config-entities/read';
import { errorLog } from '@/src/server/logger';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { toConfigEntityRows } from '@/src/utils/config-entities/rows';

/**
 * Both option lists come from DIAL Core's merged configuration — the union of its API-written and
 * config-file populations — so every option offered here resolves in the same map Core validates a
 * reference against. A partial read still returns the population it could read, and says so.
 *
 * Warnings are pushed as i18n keys rather than sentences: this runs on the server, where no translator
 * is available, so the client component resolves them.
 *
 * Shared by every Core-direct asset detail page that offers a Core-populated picker
 * (`assets-app-runners`, `assets-models`) so the read/degrade/warn behavior stays identical rather
 * than being re-derived per page.
 */
export async function readConfigEntities<T>(
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
 * A failed read is reported rather than passed off as an empty chain: the interceptors tab numbers an
 * entity's own interceptors after the global ones, so silently treating "unreadable" as "none
 * configured" would misstate the actual execution order.
 */
export async function readGlobalInterceptors(token: Token, warnings: EntitiesI18nKey[]): Promise<string[]> {
  const result = await getGlobalInterceptors(token);

  if (result.success) {
    return result.data;
  }

  errorLog(`Failed to read global interceptors from Core: ${result.failure.errorMessage ?? ''}`);
  warnings.push(EntitiesI18nKey.GlobalInterceptorsUnavailable);
  return [];
}
