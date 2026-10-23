'use server';

import { cookies, headers } from 'next/headers';

import { assetApi, catalogSchemasApi, configFileApi } from '@/src/app/api/api';
import { DialCatalogSchemaResource } from '@/src/models/dial/resource';
import { ServerActionResponse } from '@/src/models/server-action';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { stripMetadata } from '@/src/server/assets/exim';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { CORE_UNENCODABLE_ID_CHARS } from '@/src/utils/core-schemas/constants';
import { hasUnencodableSchemaIdChars } from '@/src/utils/core-schemas/resource-name';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

const MISSING_ID_ERROR: ServerActionResponse = {
  success: false,
  errorHeader: 'Missing catalog schema id',
  errorMessage: 'A catalog schema needs a declared schema id.',
};

const MISSING_NAME_ERROR: ServerActionResponse = {
  success: false,
  errorHeader: 'Missing catalog schema name',
  errorMessage: 'A catalog schema needs a storage name DIAL Core can address.',
};

const INVALID_ID_ERROR: ServerActionResponse = {
  success: false,
  errorHeader: 'Invalid catalog schema id',
  errorMessage: `The id must not contain any of the characters ${CORE_UNENCODABLE_ID_CHARS.join(
    ' ',
  )}, which DIAL Core cannot store.`,
};

const checkSchemaId = (id?: string): ServerActionResponse | null => {
  if (!id?.trim()) {
    return MISSING_ID_ERROR;
  }
  return hasUnencodableSchemaIdChars(id) ? INVALID_ID_ERROR : null;
};

const checkSchemaName = (name?: string): ServerActionResponse | null => {
  if (!name?.trim()) {
    return MISSING_NAME_ERROR;
  }
  return hasUnencodableSchemaIdChars(name) ? INVALID_ID_ERROR : null;
};

/**
 * Core stores this body verbatim, so anything sent persists in the stored schema — including the
 * `name` and `status` Core itself injects on read, which would then break meta-schema conformance.
 * `status` (with `validationWarnings`) and every other merge graft now nest under `_metadata`,
 * which `stripMetadata` drops wholesale (see the `core-resource-entity-metadata` capability);
 * `name` is additionally stripped because Core re-injects it flat on every read, and
 * `createdAt`/`updatedAt` because `ModifiedEntity` types the pair.
 */
function toCatalogSchemaPayload(schema: DialCatalogSchemaResource) {
  const { name: __name, createdAt: __createdAt, updatedAt: __updatedAt, ...payload } = stripMetadata(schema);
  return payload;
}

export async function getCatalogSchemas(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.list(token, ResourceType.CATALOG_SCHEMA, path);
}

export async function getAllCatalogSchemas() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.list(token, ResourceType.CATALOG_SCHEMA, '');
}

export async function createCatalogSchema(schema: DialCatalogSchemaResource): Promise<ServerActionResponse> {
  const idError = checkSchemaId(schema.$id);
  if (idError) {
    return idError;
  }
  const nameError = checkSchemaName(schema.name);
  if (nameError) {
    return nameError;
  }
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.CATALOG_SCHEMA, schema.name as string, toCatalogSchemaPayload(schema));
}

export async function getCatalogSchema(path: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.getMergedWithEtag<DialCatalogSchemaResource>(token, ResourceType.CATALOG_SCHEMA, path, etag);
}

export async function updateCatalogSchema(
  schema: DialCatalogSchemaResource,
  etag: string,
): Promise<ServerActionResponse> {
  const idError = checkSchemaId(schema.$id);
  if (idError) {
    return idError;
  }
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.CATALOG_SCHEMA, schema.name as string, toCatalogSchemaPayload(schema), {
    etag,
  });
}

export async function removeCatalogSchema(path: string, etag?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.delete(token, ResourceType.CATALOG_SCHEMA, path, etag);
}

export async function bulkDeleteCatalogSchemas(paths: { path: string }[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return bulkDeleteAssets(assetApi, token, ResourceType.CATALOG_SCHEMA, paths);
}

/**
 * The schema body the values editor renders from, resolved by `$id` against the merged
 * configuration. Deliberately not an `assetApi` read: a schema declared in Core's configuration
 * file has no bucket resource to read, and a selection may name either population.
 */
export async function getCatalogSchemaById(id: string): Promise<ServerActionResponse> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return catalogSchemasApi.schema(token, id);
}

export async function getConfigFileCatalogSchemas() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return configFileApi.listNames(token, ConfigFileEntityType.CatalogSchemas);
}

/**
 * Finds the storage path of the bucket resource that declares this `$id`. A bucket schema is stored
 * under the name an admin typed, the bucket listing carries no `$id`, and Core has no lookup from
 * `$id` to that name — so this costs the listing plus one content read per resource. Only for when
 * the cheaper reads by path and from the configuration file have both missed.
 */
export async function findCatalogSchemaPathById(id: string): Promise<string | null> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const resources = await assetApi.list(token, ResourceType.CATALOG_SCHEMA, '');
  const declaredIds = await Promise.all(
    resources.map(async ({ path }) => {
      try {
        const content = await assetApi.getContent<{ $id?: string }>(token, ResourceType.CATALOG_SCHEMA, path);
        return content?.$id;
      } catch {
        return undefined;
      }
    }),
  );
  const index = declaredIds.indexOf(id);

  return index === -1 ? null : resources[index].path;
}

/** Reads the schema Core's configuration file declares under this `$id`, keyed as Core keys it. */
export async function getConfigFileCatalogSchema(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return configFileApi.getEntity<DialCatalogSchemaResource>(token, ConfigFileEntityType.CatalogSchemas, name);
}
