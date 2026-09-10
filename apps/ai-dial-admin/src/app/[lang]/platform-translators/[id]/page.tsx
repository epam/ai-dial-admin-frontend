import { notFound } from 'next/navigation';

import TranslatorAssetView from '@/src/components/Assets/Platform/Translators/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialTranslatorResource } from '@/src/models/dial/resource';
import { errorObjLog } from '@/src/server/logger';
import { getTranslator } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  let etag = DEFAULT_ETAG;
  let translator: DialTranslatorResource | null = null;

  try {
    const path = (await params.params).id;

    translator = await getTranslator(path, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as DialTranslatorResource | null;
    });
  } catch (e) {
    errorObjLog(e, 'Failed to fetch translator asset data');
  }

  if (translator == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <TranslatorAssetView etag={etag} originalTranslator={translator} />
    </SaveValidationContextProvider>
  );
}
