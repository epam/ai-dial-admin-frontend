import { RESOURCE_TYPE_PREFIX } from '@/src/constants/publications-core';
import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { ResourceType } from '@/src/types/resource-type';
import { CoreApi } from './core-api';

const CORE_APP_TYPE_SCHEMA_URL = 'v1/application_type_schemas/schema';

/**
 * App-runner reads that don't fit the generic `AssetApi` resource shape. Core resolves the schema
 * declared by `dial:applicationTypeSchemaEndpoint` itself — downloading it, merging it under the
 * stored schema, and caching the result — so the resolved read is a passthrough rather than an
 * external fetch the frontend performs. Core also strips the endpoint fields from this response,
 * which is why it is not a substitute for the plain content read.
 *
 * Lookup is by Core config-map key, which for an API-written runner is its canonical ID
 * (`schemas/platform/{name}`) rather than the runner's own `$id`.
 */
export class AppRunnerSchemaApi extends CoreApi {
  resolvedSchema(token: Token, name: string): Promise<ServerActionResponse> {
    const canonicalId = `${RESOURCE_TYPE_PREFIX[ResourceType.APP_TYPE_SCHEMA]}${name}`;
    const url = `${CORE_APP_TYPE_SCHEMA_URL}?id=${encodeURIComponent(canonicalId)}`;
    return this.getAction(url, token);
  }
}
