import { EntitiesI18nKey } from '@/src/constants/i18n';
import { coreUtilityApi } from '@/src/app/api/api';
import { Token } from '@/src/models/auth';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialModel } from '@/src/models/dial/model';
import { CallerDeploymentKind } from '@/src/server/core/core-utility-api';
import { errorLog } from '@/src/server/logger';

export interface CallerOptions {
  models: DialModel[];
  applications: DialApplication[];
  schemes: DialApplicationScheme[];
}

async function readDeployments<T extends DialModel | DialApplication>(
  token: Token,
  kind: CallerDeploymentKind,
  warnings: EntitiesI18nKey[],
): Promise<T[]> {
  const result = await coreUtilityApi.getCallerDeployments(token, kind);

  if (!result.success) {
    errorLog(`Failed to read the caller's ${kind} from Core: ${result.errorMessage ?? ''}`);
    warnings.push(EntitiesI18nKey.OptionListUnavailable);
    return [];
  }

  return (result.response?.data ?? []).map(
    ({ id, display_name }) => ({ name: id, displayName: display_name ?? id }) as T,
  );
}

/**
 * The dependency pickers for a caller without admin access, from the lists Core gives every user
 * instead of its admin-only configuration API. The deployment lists hold exactly what Core accepts as a
 * dependency from this caller, so they are the valid choices rather than a narrower view of them.
 */
export async function readCallerOptions(token: Token, warnings: EntitiesI18nKey[]): Promise<CallerOptions> {
  const [models, applications, schemesResult] = await Promise.all([
    readDeployments<DialModel>(token, CallerDeploymentKind.Models, warnings),
    readDeployments<DialApplication>(token, CallerDeploymentKind.Applications, warnings),
    coreUtilityApi.getRunnerSchemas(token),
  ]);

  if (!schemesResult.success) {
    errorLog(`Failed to read the runner schemas from Core: ${schemesResult.errorMessage ?? ''}`);
    warnings.push(EntitiesI18nKey.OptionListUnavailable);
  }

  const schemes = schemesResult.success && Array.isArray(schemesResult.response) ? schemesResult.response : [];

  return { models, applications, schemes };
}
