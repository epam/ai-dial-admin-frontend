import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { telemetryApi } from '@/src/app/api/api';
import UsageLog from '@/src/components/Telemetry/UsageLog';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import { logger } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import Page403 from '@/src/components/Page403/Page403';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let data: any[] | null = [];
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  try {
    data = await telemetryApi.getUsageLog(token);
    if (data === void 0) {
      return <Page403 />;
    }
  } catch (e) {
    logger.error('Getting usage log error', e);
  }

  return <UsageLog data={data || []} />;
}
