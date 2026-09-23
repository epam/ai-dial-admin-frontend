import { beforeEach, describe, expect, test, vi } from 'vitest';

import { assetApi, catalogSchemasApi } from '@/src/app/api/api';
import { CatalogEntityType } from '@/src/models/dial/catalog-schema';
import { DialCatalogSchemaResource, DialModelResourceStatus } from '@/src/models/dial/resource';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  bulkDeleteCatalogSchemas,
  createCatalogSchema,
  getAllCatalogSchemas,
  getCatalogSchema,
  getCatalogSchemaById,
  getCatalogSchemas,
  removeCatalogSchema,
  updateCatalogSchema,
} from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

const ID = 'https://dial.epam.com/catalog_schemas/agent';
const ENCODED = 'https%3A%2F%2Fdial.epam.com%2Fcatalog_schemas%2Fagent';

const catalogSchema = {
  $id: ID,
  'dial:catalogEntityType': CatalogEntityType.Agent,
  'dial:catalogDisplayName': 'Agent',
} as DialCatalogSchemaResource;

describe('Catalog schemas :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should list the schemas under a path', async () => {
    (assetApi.list as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getCatalogSchemas('platform/');

    expect(assetApi.list).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.CATALOG_SCHEMA, 'platform/');
    expect(result).toEqual(RESPONSE_MOCK);
  });

  test('Should list every schema in the bucket', async () => {
    (assetApi.list as any).mockResolvedValue(RESPONSE_MOCK);

    await getAllCatalogSchemas();

    expect(assetApi.list).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.CATALOG_SCHEMA, '');
  });

  test('Should create under the percent-encoded $id', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    await createCatalogSchema(catalogSchema);

    expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.CATALOG_SCHEMA, ENCODED, {
      $id: ID,
      'dial:catalogEntityType': CatalogEntityType.Agent,
      'dial:catalogDisplayName': 'Agent',
    });
  });

  test('Should update under the percent-encoded $id, passing the etag through', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    await updateCatalogSchema(catalogSchema, 'etag-1');

    expect(assetApi.put).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.CATALOG_SCHEMA,
      ENCODED,
      expect.objectContaining({ $id: ID }),
      { etag: 'etag-1' },
    );
  });

  test.each([
    ['create', createCatalogSchema],
    ['update', (schema: DialCatalogSchemaResource) => updateCatalogSchema(schema, 'etag-1')],
  ])('Should strip the fields Core injects on read before a %s', async (_label, action) => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    // A merged read carries `path`/`folderId`/`status`/`validationWarnings`/`author` only under
    // `_metadata` (dropped wholesale by `stripMetadata`); `name` also sits flat because the
    // create-flow seeds it and Core re-injects it on every read, and `createdAt`/`updatedAt`
    // because `ModifiedEntity` types the pair — the payload builder destructures those spellings out.
    await action({
      ...catalogSchema,
      name: ENCODED,
      createdAt: '100',
      updatedAt: '200',
      _metadata: {
        name: ENCODED,
        path: ENCODED,
        folderId: '',
        author: 'ivy',
        status: DialModelResourceStatus.Valid,
        validationWarnings: [{ field: 'x', message: 'y' }],
        createdAt: '100',
        updatedAt: '200',
      },
    } as DialCatalogSchemaResource);

    const payload = (assetApi.put as any).mock.calls[0][3];

    expect(payload).toEqual({
      $id: ID,
      'dial:catalogEntityType': CatalogEntityType.Agent,
      'dial:catalogDisplayName': 'Agent',
    });
  });

  test('Should keep the schema body, including properties, on write', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);
    const properties = { badge: { type: 'string', format: 'dial-file-encoded', 'dial:file': true } };

    await createCatalogSchema({ ...catalogSchema, properties } as DialCatalogSchemaResource);

    expect((assetApi.put as any).mock.calls[0][3].properties).toEqual(properties);
  });

  test.each([
    ['create', createCatalogSchema],
    ['update', (schema: DialCatalogSchemaResource) => updateCatalogSchema(schema, 'etag-1')],
  ])('Should refuse a %s with no $id without calling Core', async (_label, action) => {
    const result = await action({ 'dial:catalogDisplayName': 'Agent' } as DialCatalogSchemaResource);

    expect(result.success).toBe(false);
    expect(result.errorHeader).toEqual('Missing catalog schema id');
    expect(assetApi.put).not.toHaveBeenCalled();
  });

  test('Should refuse a whitespace-only $id without calling Core', async () => {
    const result = await createCatalogSchema({ ...catalogSchema, $id: '   ' } as DialCatalogSchemaResource);

    expect(result.success).toBe(false);
    expect(result.errorHeader).toEqual('Missing catalog schema id');
    expect(assetApi.put).not.toHaveBeenCalled();
  });

  test.each(['!', '~', '*', "'", '(', ')'])('Should refuse an $id containing %s without calling Core', async (char) => {
    const result = await createCatalogSchema({
      ...catalogSchema,
      $id: `https://host/schema${char}`,
    } as DialCatalogSchemaResource);

    expect(result.success).toBe(false);
    expect(result.errorHeader).toEqual('Invalid catalog schema id');
    expect(assetApi.put).not.toHaveBeenCalled();
  });

  test('Should read one schema with its etag', async () => {
    (assetApi.getMergedWithEtag as any).mockResolvedValue(RESPONSE_MOCK);

    await getCatalogSchema(ENCODED, 'etag-1');

    expect(assetApi.getMergedWithEtag).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.CATALOG_SCHEMA, ENCODED, 'etag-1');
  });

  test.each([
    ['with an etag', 'etag-1'],
    ['without an etag', undefined],
  ])('Should delete one schema %s', async (_label, etag) => {
    (assetApi.delete as any).mockResolvedValue(RESPONSE_MOCK);

    await removeCatalogSchema(ENCODED, etag);

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.CATALOG_SCHEMA, ENCODED, etag);
  });

  test('Should bulk delete the given paths', async () => {
    (assetApi.delete as any).mockResolvedValue(RESPONSE_MOCK);
    const paths = [{ path: ENCODED }, { path: 'plain' }];

    await bulkDeleteCatalogSchemas(paths);

    expect(assetApi.delete).toHaveBeenCalledTimes(2);
  });

  test('Should resolve one schema body by its own $id rather than a resource path', async () => {
    (catalogSchemasApi.schema as any).mockResolvedValue(RESPONSE_MOCK);

    await getCatalogSchemaById(ID);

    expect(catalogSchemasApi.schema).toHaveBeenCalledWith(TOKEN_MOCK, ID);
    expect(assetApi.getMergedWithEtag).not.toHaveBeenCalled();
  });
});
