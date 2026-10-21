import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { CoreApi } from './core-api';

const CORE_APP_TYPE_SCHEMA_URL = 'v1/application_type_schemas/schema';

/**
 * App-runner reads that don't fit the generic `AssetApi` resource shape. Core resolves the schema
 * declared by `dial:applicationTypeSchemaEndpoint` itself — downloading it, merging it under the
 * stored schema, and caching the result — so the resolved read is a passthrough rather than an
 * external fetch the frontend performs. Core also strips the endpoint fields from this response,
 * which is why it is not a substitute for the plain content read.
 *
 * Lookup is by the runner's own `$id`, URL-encoded once for the query string. DIAL Core PR #1813
 * changed the key from the canonical config-map path (`schemas/platform/{name}`) to the schema's `$id`.
 */
export class AppRunnerSchemaApi extends CoreApi {
  resolvedSchema(token: Token, name: string): Promise<ServerActionResponse> {
    const url = `${CORE_APP_TYPE_SCHEMA_URL}?id=${encodeURIComponent(name)}`;
    return this.getAction(url, token);
  }
}
