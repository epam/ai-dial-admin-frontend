import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import InterceptorAssetView from '@/src/components/Assets/Platform/Interceptors/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialInterceptorResource } from '@/src/models/dial/resource';
import { readCatalogSchemaOptions } from '@/src/server/catalog-schemas/read-options';
import { errorObjLog } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getConfigFileInterceptor, getInterceptor } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ configFile?: string }>;
}) {
  const isConfigFileMode = (await params.searchParams).configFile === 'true';
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let etag = DEFAULT_ETAG;
  let interceptor: DialInterceptorResource | null = null;

  try {
    const path = (await params.params).id;

    if (isConfigFileMode) {
      const result = await getConfigFileInterceptor(path);
      interceptor = result.success ? (result.data as unknown as DialInterceptorResource) : null;
    } else {
      interceptor = await getInterceptor(decodeURIComponent(path), etag).then((res) => {
        etag = res?.etag || DEFAULT_ETAG;
        return res?.response as DialInterceptorResource | null;
      });
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch interceptor asset data');
  }

  // Deliberately outside the resource fetch's try: an unreadable option list must not stop the
  // interceptor from loading — the picker reports the failure itself.
  const catalogSchemas = await readCatalogSchemaOptions(token);

  if (interceptor == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <InterceptorAssetView
        etag={etag}
        originalInterceptor={interceptor}
        catalogSchemas={catalogSchemas}
        isConfigFileSource={isConfigFileMode}
      />
    </SaveValidationContextProvider>
  );
}
