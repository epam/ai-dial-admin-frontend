import { notFound } from 'next/navigation';

import InterceptorAssetView from '@/src/components/Assets/Platform/Interceptors/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialInterceptorResource } from '@/src/models/dial/resource';
import { errorObjLog } from '@/src/server/logger';
import { getInterceptor } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  let etag = DEFAULT_ETAG;
  let interceptor: DialInterceptorResource | null = null;

  try {
    const path = (await params.params).id;

    interceptor = await getInterceptor(path, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as DialInterceptorResource | null;
    });
  } catch (e) {
    errorObjLog(e, 'Failed to fetch interceptor asset data');
  }

  if (interceptor == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <InterceptorAssetView etag={etag} originalInterceptor={interceptor} />
    </SaveValidationContextProvider>
  );
}
