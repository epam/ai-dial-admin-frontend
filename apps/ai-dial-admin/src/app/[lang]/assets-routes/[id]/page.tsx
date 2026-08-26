import { notFound } from 'next/navigation';

import RouteAssetView from '@/src/components/Assets/Routes/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialRouteResource } from '@/src/models/dial/resource';
import { errorObjLog } from '@/src/server/logger';
import { getRoute } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ path: string }>;
}) {
  let etag = DEFAULT_ETAG;
  let route: DialRouteResource | null = null;

  try {
    // Next already decodes the query param once, which restores the resource name `ResourceInfo.path`
    // carries. Decoding again would corrupt any name containing a percent sign.
    const path = (await params.searchParams).path;

    route = await getRoute(path, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as DialRouteResource | null;
    });
  } catch (e) {
    errorObjLog(e, 'Failed to fetch route asset data');
  }

  if (route == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <RouteAssetView etag={etag} originalRoute={route} />
    </SaveValidationContextProvider>
  );
}
