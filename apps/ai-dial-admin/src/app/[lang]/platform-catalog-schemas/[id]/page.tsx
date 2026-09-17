import { notFound } from 'next/navigation';

import CatalogSchemaView from '@/src/components/Assets/Platform/CatalogSchemas/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialCatalogSchemaResource } from '@/src/models/dial/resource';
import { errorObjLog } from '@/src/server/logger';
import { getCatalogSchema } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  let etag = DEFAULT_ETAG;
  let schema: DialCatalogSchemaResource | null = null;

  try {
    const path = (await params.params).id;

    schema = await getCatalogSchema(path, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as DialCatalogSchemaResource | null;
    });
  } catch (e) {
    errorObjLog(e, 'Failed to fetch catalog schema data');
  }

  if (schema == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <CatalogSchemaView etag={etag} originalSchema={schema} />
    </SaveValidationContextProvider>
  );
}
