import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { promptsApi } from '@/src/app/api/api';
import PromptView from '@/src/components/PromptView/PromptView';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ApplicationRoute } from '@/src/types/routes';
import { logger } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { DialFileNodeType } from '@/src/models/dial/file';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ path: string }>;
}) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let prompts: DialPrompt[] = [];
  let prompt: DialPrompt | null = null;

  try {
    const path = decodeURIComponent((await params.searchParams).path);
    const name = decodeURIComponent((await params.params).id);

    prompt = await promptsApi.getPrompt(token, path);
    prompts =
      (await promptsApi.getPromptsList(token, `${prompt?.folderId}/`))?.filter(
        (p) => p.nodeType === DialFileNodeType.ITEM && p.name === name,
      ) || [];
  } catch (e) {
    logger.error('Getting prompt view data error', e);
  }
  if (prompt == null) {
    redirect(ApplicationRoute.Prompts);
  }

  return <PromptView originalPrompt={prompt} prompts={prompts} />;
}
