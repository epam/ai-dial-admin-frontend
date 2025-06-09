import AssistantsList from '@/src/components/AssistantsList/AssistantsList';
import { DialAssistant } from '@/src/models/dial/assistant';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { cookies, headers } from 'next/headers';
import { logger } from '@/src/server/logger';
import { redirect } from 'next/navigation';
import { assistantsApi } from '@/src/app/api/api';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { SIGN_IN_LINK } from '@/src/constants/auth';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  let data: DialAssistant[] = [];

  try {
    data = (await assistantsApi.getAssistantsList(token)) || [];
  } catch (e) {
    logger.error('Getting assistants error', e);
  }
  return <AssistantsList data={data} />;
}
