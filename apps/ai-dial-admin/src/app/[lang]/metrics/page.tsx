import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { errorObjLog } from '@/src/server/logger';
import MetricsList from '@/src/components/Metrics/List/List';

export const dynamic = 'force-dynamic';

export default async function Page() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let data: object[] | null = null;

  try {
    data = [];
  } catch (e) {
    errorObjLog(e, 'Failed to fetch metrics');
  }

  if (data == null) {
    notFound();
  }

  return <MetricsList data={data || []} />;
}
