import { notFound } from 'next/navigation';

import TranslatorAssetView from '@/src/components/Assets/Platform/Translators/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialTranslatorResource } from '@/src/models/dial/resource';
import { errorObjLog } from '@/src/server/logger';
import { getConfigFileTranslator, getTranslator } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ configFile?: string }>;
}) {
  const isConfigFileMode = (await params.searchParams).configFile === 'true';
  let etag = DEFAULT_ETAG;
  let translator: DialTranslatorResource | null = null;

  try {
    const path = (await params.params).id;

    if (isConfigFileMode) {
      const result = await getConfigFileTranslator(path);
      translator = result.success ? result.data : null;
    } else {
      translator = await getTranslator(decodeURIComponent(path), etag).then((res) => {
        etag = res?.etag || DEFAULT_ETAG;
        return res?.response as DialTranslatorResource | null;
      });
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch translator asset data');
  }

  if (translator == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <TranslatorAssetView etag={etag} originalTranslator={translator} isConfigFileSource={isConfigFileMode} />
    </SaveValidationContextProvider>
  );
}
