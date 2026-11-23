import { notFound } from 'next/navigation';

import PluginAssetView from '@/src/components/Assets/Platform/Plugins/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialPluginResource } from '@/src/models/dial/resource';
import { errorObjLog } from '@/src/server/logger';
import { getConfigFilePlugin, getPlugin } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ configFile?: string }>;
}) {
  const isConfigFileMode = (await params.searchParams).configFile === 'true';
  let etag = DEFAULT_ETAG;
  let plugin: DialPluginResource | null = null;

  try {
    const path = (await params.params).id;

    if (isConfigFileMode) {
      const result = await getConfigFilePlugin(path);
      plugin = result.success ? result.data : null;
    } else {
      plugin = await getPlugin(decodeURIComponent(path), etag).then((res) => {
        etag = res?.etag || DEFAULT_ETAG;
        return res?.response as DialPluginResource | null;
      });
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch plugin asset data');
  }

  if (plugin == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <PluginAssetView etag={etag} originalPlugin={plugin} isConfigFileSource={isConfigFileMode} />
    </SaveValidationContextProvider>
  );
}
