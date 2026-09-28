import { notFound } from 'next/navigation';

import PromptView from '@/src/components/Assets/Prompts/View/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialPrompt } from '@/src/models/dial/prompt';
import { errorObjLog } from '@/src/server/logger';
import { getPrompt } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ path: string }>;
}) {
  let etag = DEFAULT_ETAG;

  let prompt: DialPrompt | null = null;

  try {
    const path = decodeURIComponent((await params.searchParams).path);

    prompt = await getPrompt(path, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as DialPrompt | null;
    });
  } catch (e) {
    errorObjLog(e, 'Failed to fetch prompt view data');
  }
  if (prompt == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <PromptView originalPrompt={prompt} etag={etag} />
    </SaveValidationContextProvider>
  );
}
