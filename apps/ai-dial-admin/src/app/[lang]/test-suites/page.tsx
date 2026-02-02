import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { errorObjLog } from '@/src/server/logger';
import TestSuitesList from '@/src/components/TestSuites/List/List';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { testSuitesApi } from '@/src/app/api/api';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let data: TestSuite[] | null = null;

  try {
    data = await testSuitesApi.getTestSuites(token);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch test suites');
  }

  // if (data == null) {
  //   notFound();
  // }

  return <TestSuitesList data={[{ name: 'name' }]} />;
}
