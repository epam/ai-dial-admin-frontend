import { notFound } from 'next/navigation';

import ModelView from '@/src/components/Assets/Models/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { AssetModel } from '@/src/models/dial/deployment-asset';
import { errorObjLog } from '@/src/server/logger';
import { getModel } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ path: string }>;
}) {
  let etag = DEFAULT_ETAG;
  let model: AssetModel | null = null;

  try {
    const path = decodeURIComponent((await params.searchParams).path);

    model = await getModel(path, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as AssetModel | null;
    });
  } catch (e) {
    errorObjLog(e, 'Failed to fetch model view data');
  }
  if (model == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <ModelView etag={etag} originalModel={model} />
    </SaveValidationContextProvider>
  );
}
