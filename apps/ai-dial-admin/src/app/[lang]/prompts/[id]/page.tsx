import { notFound } from 'next/navigation';

import PromptView from '@/src/components/Assets/Prompts/View/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Asset } from '@/src/models/dial/deployment-asset';
import { DialFileNodeType } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { errorObjLog } from '@/src/server/logger';
import { getPrompt, getPrompts } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ path: string }>;
}) {
  let etag = DEFAULT_ETAG;

  let prompts: DialPrompt[] = [];
  let prompt: DialPrompt | null = null;

  try {
    const path = decodeURIComponent((await params.searchParams).path);
    const name = decodeURIComponent((await params.params).id);

    prompt = await getPrompt(path, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as DialPrompt | null;
    });

    prompts = ((await getPrompts(prompt?.folderId as string))?.filter(
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
