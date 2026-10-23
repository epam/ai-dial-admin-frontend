import { notFound, redirect } from 'next/navigation';

import CatalogSchemaView from '@/src/components/Assets/Platform/CatalogSchemas/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialCatalogSchemaResource } from '@/src/models/dial/resource';
import { errorObjLog } from '@/src/server/logger';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { findCatalogSchemaPathById, getCatalogSchema, getConfigFileCatalogSchema } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string; lang?: string }> }) {
  let etag = DEFAULT_ETAG;
  let schema: DialCatalogSchemaResource | null = null;
  let isConfigFileSchema = false;
  let storagePath: string | null = null;
  const { id: path, lang } = await params.params;

  try {
    const result = await getCatalogSchema(decodeURIComponent(path), etag);
    etag = result?.etag || DEFAULT_ETAG;
    schema = result?.success ? (result.response as DialCatalogSchemaResource) : null;

    // A schema declared in Core's configuration file has no bucket resource, and Core keys that
    // map by `$id` — so one URL resolves either population rather than 404-ing for half of them.
    // With no config-file list on this surface, it is the only way such a schema opens at all.
    if (schema == null) {
      const fileResult = await getConfigFileCatalogSchema(decodeURIComponent(path));
      schema = fileResult.success ? (fileResult.data as unknown as DialCatalogSchemaResource) : null;
      isConfigFileSchema = schema != null;
      etag = DEFAULT_ETAG;
    }

    // A deployment's schema field knows only the `$id`, which a bucket resource's storage name need
    // not match. The match is sent on to its canonical address, so save and etag work as from the grid.
    if (schema == null) {
      storagePath = await findCatalogSchemaPathById(decodeURIComponent(path));
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch catalog schema data');
  }

  // Outside the `try`: `redirect` throws, and the catch above would swallow it.
  if (storagePath != null) {
    const segment = getUrnForEntity(ApplicationRoute.PlatformCatalogSchemas, { path: storagePath });
    redirect(lang ? `/${lang}${segment}` : segment);
  }

  if (schema == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <CatalogSchemaView etag={etag} originalSchema={schema} isConfigFileSource={isConfigFileSchema} />
    </SaveValidationContextProvider>
  );
}
