import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import TranslatorAssetView from '@/src/components/Assets/Platform/Translators/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialTranslatorResource } from '@/src/models/dial/resource';
import { readPluginOptions } from '@/src/server/config-entities/read-plugin-options';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { errorObjLog } from '@/src/server/logger';
import { getConfigFileTranslator, getTranslator } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ configFile?: string }>;
}) {
  const isConfigFileMode = (await params.searchParams).configFile === 'true';
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
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

  const plugins = await readPluginOptions(token);

  if (translator == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <TranslatorAssetView
        etag={etag}
        originalTranslator={translator}
        isConfigFileSource={isConfigFileMode}
        plugins={plugins}
      />
    </SaveValidationContextProvider>
  );
}
