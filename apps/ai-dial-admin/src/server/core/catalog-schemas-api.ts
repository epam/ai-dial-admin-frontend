import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { CoreApi } from './core-api';

const CORE_CATALOG_SCHEMAS_URL = 'v1/catalog_schemas/schemas';
const CORE_CATALOG_SCHEMA_URL = 'v1/catalog_schemas/schema';

/**
 * Reads that resolve against DIAL Core's merged configuration rather than a bucket, so both schema
 * populations answer through one route. `AssetApi` cannot serve either: it lists a bucket, which
 * holds only the API-written half. Lookup is by the schema's own `$id`, as `AppRunnerSchemaApi` does.
 */
export class CatalogSchemasApi extends CoreApi {
  listSchemas(token: Token): Promise<ServerActionResponse> {
    return this.getAction(CORE_CATALOG_SCHEMAS_URL, token);
  }

  schema(token: Token, id: string): Promise<ServerActionResponse> {
    return this.getAction(`${CORE_CATALOG_SCHEMA_URL}?id=${encodeURIComponent(id)}`, token);
  }
}
