import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { errorObjLog } from '@/src/server/logger';
import TestSuitsList from '@/src/components/TestSuits/List/List';
import { TestSuits } from '@/src/models/evaluation/test-suit';
import { testSuitsApi } from '@/src/app/api/api';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let data: TestSuits[] | null = null;

  try {
    data = await testSuitsApi.getTestSuits(token);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch test suits');
  }

  if (data == null) {
    notFound();
  }

  return <TestSuitsList data={data || []} />;
}
