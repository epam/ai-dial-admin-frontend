import { notFound } from 'next/navigation';

import TestSuiteView from '@/src/components/TestSuites/View/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { FileFolderProvider } from '@/src/context/assets/FileFolderContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { errorObjLog } from '@/src/server/logger';
import { getTestSuite } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  let testSuite: TestSuite | null = null;
  let etag = DEFAULT_ETAG;

  try {
    testSuite = await getTestSuite((await params.params).id, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as TestSuite | null;
    });
  } catch (e) {
    errorObjLog(e, 'Failed to fetch test suite view data');
  }

  if (testSuite == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <FileFolderProvider>
        <TestSuiteView originalTestSuite={testSuite} etag={etag} />
      </FileFolderProvider>
    </SaveValidationContextProvider>
  );
}
