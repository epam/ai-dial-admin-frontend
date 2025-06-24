import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { modelsApi, adaptersApi } from '@/src/app/api/api';
import ModelsList from '@/src/components/ModelsList/ModelsList';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialModel } from '@/src/models/dial/model';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import { logger } from '@/src/server/logger';
import Page403 from '@/src/components/Page403/Page403';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  let data: DialModel[] | null = [];
  let adapters: DialAdapter[] | null = [];

  try {
    data = await modelsApi.getModelsList(token);
    adapters = await adaptersApi.getAdaptersList(token);
    if (data === void 0 || adapters === void 0) {
      return <Page403 />;
    }
  } catch (e) {
    logger.error('Getting models error', e);
  }

  return <ModelsList data={data || []} adapters={adapters || []} />;
}
