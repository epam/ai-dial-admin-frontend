'use server';

import { cookies, headers } from 'next/headers';

import { assetApi, catalogSchemasApi, configFileApi } from '@/src/app/api/api';
import { DialCatalogSchemaResource } from '@/src/models/dial/resource';
import { ServerActionResponse } from '@/src/models/server-action';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { CORE_UNENCODABLE_ID_CHARS } from '@/src/utils/core-schemas/constants';
import { hasUnencodableSchemaIdChars, toCoreSchemaResourceName } from '@/src/utils/core-schemas/resource-name';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

const MISSING_ID_ERROR: ServerActionResponse = {
  success: false,
  errorHeader: 'Missing catalog schema id',
  errorMessage: 'A catalog schema needs an id — it becomes the resource name DIAL Core stores it under.',
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

/**
 * Core stores this body verbatim, so anything sent persists in the stored schema — including the
 * `name` and `status` Core itself injects on read, which would then break meta-schema conformance.
 */
function toCatalogSchemaPayload(schema: DialCatalogSchemaResource) {
  const {
    name: __name,
    status: __status,
    validationWarnings: __validationWarnings,
    path: __path,
    folderId: __folderId,
    author: __author,
    createdAt: __createdAt,
    updatedAt: __updatedAt,
    ...payload
  } = schema;
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
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(
    token,
    ResourceType.CATALOG_SCHEMA,
    toCoreSchemaResourceName(schema.$id as string),
    toCatalogSchemaPayload(schema),
  );
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
  return assetApi.put(
    token,
    ResourceType.CATALOG_SCHEMA,
    toCoreSchemaResourceName(schema.$id as string),
    toCatalogSchemaPayload(schema),
    { etag },
  );
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

/** `config-file-entity-views`: the catalog-schema names Core's configuration file declares. */
export async function getConfigFileCatalogSchemas() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return configFileApi.listNames(token, ConfigFileEntityType.CatalogSchemas);
}

/** `config-file-entity-views`: reads one file-declared catalog schema by name. */
export async function getConfigFileCatalogSchema(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return configFileApi.getEntity<DialCatalogSchemaResource>(token, ConfigFileEntityType.CatalogSchemas, name);
}
