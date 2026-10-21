import { catalogSchemasApi } from '@/src/app/api/api';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { Token } from '@/src/models/auth';
import { CatalogSchemaOption } from '@/src/models/dial/catalog-schema';
import { errorLog } from '@/src/server/logger';

export interface CatalogSchemaOptions {
  options: CatalogSchemaOption[];
  /** An i18n key the picker resolves; set only when the read failed. */
  error?: EntitiesI18nKey;
}

/**
 * A failure is reported rather than degraded to an empty list: a registered schema missing from the
 * picker reads as deleted, and the deployment already pointing at it would look unattached. Shared
 * by every surface offering the picker, the same reason `readConfigEntities` exists.
 */
export async function readCatalogSchemaOptions(token: Token): Promise<CatalogSchemaOptions> {
  const result = await catalogSchemasApi.listSchemas(token);

  if (!result.success) {
    errorLog(`Failed to read catalog schema options from Core: ${result.errorMessage ?? ''}`);
    return { options: [], error: EntitiesI18nKey.OptionListUnavailable };
  }

  const options = result.response as CatalogSchemaOption[] | undefined;
  return { options: Array.isArray(options) ? options : [] };
}
