import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import DashboardView from '@/src/components/Telemetry/DashboardView';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import { PROJECT_QUERY } from '@/src/constants/telemetry';
import { getDashboardData } from './actions';
import Page403 from '@/src/components/Page403/Page403';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  const data = await getDashboardData(PROJECT_QUERY);
  if (data.status === 403) {
    return <Page403 />;
  }

  return <DashboardView grafanaLink={process.env.GRAFANA_LINK} />;
}
