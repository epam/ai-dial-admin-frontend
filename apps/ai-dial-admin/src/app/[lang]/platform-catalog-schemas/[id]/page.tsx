import { notFound } from 'next/navigation';

import CatalogSchemaView from '@/src/components/Assets/Platform/CatalogSchemas/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialCatalogSchemaResource } from '@/src/models/dial/resource';
import { errorObjLog } from '@/src/server/logger';
import { getCatalogSchema, getConfigFileCatalogSchema } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ configFile?: string }>;
}) {
  const isConfigFileMode = (await params.searchParams).configFile === 'true';

  let etag = DEFAULT_ETAG;
  let schema: DialCatalogSchemaResource | null = null;
  let isConfigFileSchema = isConfigFileMode;

  try {
    const path = (await params.params).id;

    if (isConfigFileMode) {
      const result = await getConfigFileCatalogSchema(decodeURIComponent(path));
      schema = result.success ? (result.data as unknown as DialCatalogSchemaResource) : null;
    } else {
      const result = await getCatalogSchema(path, etag);
      etag = result?.etag || DEFAULT_ETAG;
      schema = result?.success ? (result.response as DialCatalogSchemaResource) : null;

      // A schema declared in Core's configuration file has no bucket resource, and Core keys that
      // map by `$id` — so one URL resolves either population rather than 404-ing for half of them.
      if (schema == null) {
        const fileResult = await getConfigFileCatalogSchema(decodeURIComponent(path));
        schema = fileResult.success ? (fileResult.data as unknown as DialCatalogSchemaResource) : null;
        isConfigFileSchema = schema != null;
        etag = DEFAULT_ETAG;
      }
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch catalog schema data');
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
