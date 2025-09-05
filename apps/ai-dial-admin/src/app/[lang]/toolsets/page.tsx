import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { toolSetsApi } from '@/src/app/api/api';
import Page403 from '@/src/components/Page403/Page403';
import ToolsetsList from '@/src/components/Toolsets/List';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Toolset } from '@/src/models/dial/toolset';
import { logger } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  let data: Toolset[] | null = [];

  try {
    data = await toolSetsApi.getToolsetList(token);
    if (data === void 0) {
      return <Page403 />;
    }
  } catch (e) {
    logger.error('Getting toolsets error', e);
  }

  return (
    <SaveValidationContextProvider>
      <ToolsetsList data={data || []} />
    </SaveValidationContextProvider>
  );
}
