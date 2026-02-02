import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { errorObjLog } from '@/src/server/logger';
import MetricsList from '@/src/components/Metrics/List/List';
import { Metric } from '@/src/models/evaluation/metric';
import { metricsApi } from '@/src/app/api/api';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let data: Metric[] | null = null;

  try {
    data = await metricsApi.getMetrics(token);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch metrics');
  }

  if (data == null) {
    notFound();
  }

  return <MetricsList data={data || []} />;
}
