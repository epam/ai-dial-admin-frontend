import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { removeAssistant, updateAssistant } from '@/src/app/[lang]/assistants/actions';
import { assistantsApi, rolesApi } from '@/src/app/api/api';
import EntityView from '@/src/components/EntityView/EntityView';
import { DialAssistant } from '@/src/models/dial/assistant';
import { DialRole } from '@/src/models/dial/role';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { logger } from '@/src/server/logger';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import Page403 from '@/src/components/Page403/Page403';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let assistants: DialAssistant[] | null = [];
  let assistant: DialAssistant | null = null;

  let roles: DialRole[] | null = [];

  try {
    assistants = await assistantsApi.getAssistantsList(token);
    assistant = await assistantsApi.getAssistant(decodeURIComponent((await params.params).id), token);
    roles = await rolesApi.getRolesList(token);
    if (assistants === void 0 || assistants === void 0 || assistants === void 0) {
      return <Page403 />;
    }
  } catch (e) {
    logger.error('Getting assistant view data error', e);
  }

  if (assistant == null) {
    redirect(ApplicationRoute.Assistants);
  }

  return (
    <EntityView
      view={ApplicationRoute.Assistants}
      names={assistants?.map((model) => model.displayName || '') || []}
      roles={roles}
      originalEntity={assistant}
      removeEntity={removeAssistant}
      updateEntity={updateAssistant}
    />
  );
}
