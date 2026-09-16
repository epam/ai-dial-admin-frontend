import { notFound } from 'next/navigation';

import InterceptorAssetView from '@/src/components/Assets/Platform/Interceptors/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialInterceptorResource } from '@/src/models/dial/resource';
import { errorObjLog } from '@/src/server/logger';
import { getConfigFileInterceptor, getInterceptor } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ configFile?: string }>;
}) {
  const isConfigFileMode = (await params.searchParams).configFile === 'true';

  let etag = DEFAULT_ETAG;
  let interceptor: DialInterceptorResource | null = null;

  try {
    const path = (await params.params).id;

    if (isConfigFileMode) {
      const result = await getConfigFileInterceptor(path);
      interceptor = result.success ? (result.data as unknown as DialInterceptorResource) : null;
    } else {
      interceptor = await getInterceptor(path, etag).then((res) => {
        etag = res?.etag || DEFAULT_ETAG;
        return res?.response as DialInterceptorResource | null;
      });
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch interceptor asset data');
  }

  if (interceptor == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <InterceptorAssetView etag={etag} originalInterceptor={interceptor} isConfigFileSource={isConfigFileMode} />
    </SaveValidationContextProvider>
  );
}
