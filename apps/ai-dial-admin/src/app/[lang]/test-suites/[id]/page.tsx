import { notFound } from 'next/navigation';

import TestSuiteView from '@/src/components/TestSuites/View/View';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { errorObjLog } from '@/src/server/logger';
import { getTestSuite } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  let testSuite: TestSuite | null = null;

  try {
    testSuite = await getTestSuite((await params.params).id);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch test suite view data');
  }

  if (testSuite == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <TestSuiteView originalTestSuite={testSuite} />
    </SaveValidationContextProvider>
  );
}
