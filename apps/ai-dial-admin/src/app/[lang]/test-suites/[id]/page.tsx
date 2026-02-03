import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { testSuitesApi } from '@/src/app/api/api';
import TestSuiteView from '@/src/components/TestSuites/View/View';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { errorObjLog } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { filterNames } from '@/src/utils/entities/filter-names';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let testSuite: TestSuite | null = null;
  let testSuites: TestSuite[] = [];

  try {
    testSuite = await testSuitesApi.getTestSuite((await params.params).id, token);
    testSuites = await testSuitesApi.getTestSuites(token);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch test suite view data');
  }

  if (testSuite == null) {
    notFound();
  }

  const names = filterNames(testSuites, testSuite?.name);

  return (
    <SaveValidationContextProvider>
      <TestSuiteView names={names} originalTestSuite={testSuite} />
    </SaveValidationContextProvider>
  );
}
