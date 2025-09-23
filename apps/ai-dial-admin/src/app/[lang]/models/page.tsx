import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { modelsApi } from '@/src/app/api/api';
import ModelsList from '@/src/components/Models/List/List';
import Page403 from '@/src/components/Page403/Page403';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import { DialModel } from '@/src/models/dial/model';
import { logger } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  let data: DialModel[] | null = [];

  try {
    data = await modelsApi.getModelsList(token);
    if (data === void 0) {
      return <Page403 />;
    }
  } catch (e) {
    logger.error('Getting models error', e);
  }

  return (
    <SaveValidationContextProvider>
      <ModelsList data={data || []} />
    </SaveValidationContextProvider>
  );
}
