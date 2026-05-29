import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { assetsApi } from '@/src/app/api/api';
import PromptView from '@/src/components/Assets/Prompts/View/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialFileNodeType } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { errorObjLog } from '@/src/server/logger';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { Asset } from '@/src/models/dial/deployment-asset';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ path: string }>;
}) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let etag = DEFAULT_ETAG;

  let prompts: DialPrompt[] = [];
  let prompt: DialPrompt | null = null;

  try {
    const path = decodeURIComponent((await params.searchParams).path);
    const name = decodeURIComponent((await params.params).id);

    prompt = await assetsApi.getAssetWithEtag(token, path, ResourceType.PROMPT, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as DialPrompt | null;
    });

    prompts = ((await assetsApi.getAssetList(token, `${prompt?.folderId}/`, ResourceType.PROMPT))?.filter(
      (p) => (p as Asset).nodeType === DialFileNodeType.ITEM && p.name === name,
    ) || []) as DialPrompt[];
  } catch (e) {
    errorObjLog(e, 'Failed to fetch prompt view data');
  }
  if (prompt == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <PromptView originalPrompt={prompt} prompts={prompts} etag={etag} />
    </SaveValidationContextProvider>
  );
}
